import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function phoneMatches(storedPhone: string, providedPhone: string) {
  const stored = normalizePhone(storedPhone);
  const provided = normalizePhone(providedPhone);

  if (!stored || !provided) return false;
  if (stored === provided) return true;

  // Permite coincidencia cuando uno trae prefijo de país (+52).
  return stored.endsWith(provided) || provided.endsWith(stored);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { orderId, phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "phone es obligatorio." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("Falta configurar el secreto STRIPE_SECRET_KEY en Supabase.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let order: {
      id: string;
      customer_phone: string;
      customer_email: string | null;
      status: string;
      created_at?: string;
    } | null = null;

    if (orderId) {
      const { data: orderById, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, customer_phone, customer_email, status")
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        throw orderError;
      }

      order = orderById;
    } else {
      // Si no mandan orderId, tomamos el pedido pendiente más
      // reciente que coincida con el teléfono proporcionado.
      const { data: pendingOrders, error: pendingOrdersError } = await supabaseAdmin
        .from("orders")
        .select("id, customer_phone, customer_email, status, created_at")
        .eq("status", "pendiente")
        .order("created_at", { ascending: false })
        .limit(25);

      if (pendingOrdersError) {
        throw pendingOrdersError;
      }

      order = (pendingOrders ?? []).find((candidate) => phoneMatches(candidate.customer_phone, phone)) ?? null;
    }

    if (!order || order.status !== "pendiente") {
      return new Response(JSON.stringify({ error: "Pedido no disponible para pago." }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!phoneMatches(order.customer_phone, phone)) {
      return new Response(JSON.stringify({ error: "No pudimos validar el pedido con ese teléfono." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select(`
        quantity,
        unit_price,
        variant:variants!inner(
          size_label,
          product:products!inner(name)
        )
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      throw itemsError;
    }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "El pedido no tiene productos para pagar." }), {
        status: 409,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: `${item.variant?.product?.name ?? "Perfume"} — ${item.variant?.size_label ?? "Variante"}`,
        },
        unit_amount: Math.round(Number(item.unit_price) * 100),
      },
      quantity: item.quantity,
    }));

    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "oxxo"],
      line_items: lineItems,
      customer_email: order.customer_email || undefined,
      metadata: {
        orderId,
        paymentRetry: "true",
      },
      success_url: "https://carlosnm0802.github.io/aegon-perfumes/confirmacion.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://carlosnm0802.github.io/aegon-perfumes/retomar-pago.html",
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url, order_id: order.id }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en reintentar-pago:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
