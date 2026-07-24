import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";

// ============================================================
// EDGE FUNCTION: crear-sesion-pago (Stripe)
// ============================================================
// Recibe los datos de un pedido ya guardado en Supabase y crea
// una "Checkout Session" de Stripe para el cobro externo.
// Soporta tarjeta Y pago en
// efectivo en OXXO. Devuelve la URL a la que el navegador debe
// redirigir al cliente para pagar.
//
// El Secret Key de Stripe SOLO existe aquí, como secreto de
// Supabase — nunca llega al navegador.
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { orderId, items, customerEmail } = await req.json();

    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("Falta configurar el secreto STRIPE_SECRET_KEY en Supabase.");
    }

    // Deno no tiene el cliente HTTP nativo de Node — Stripe exige
    // este ajuste explícito para funcionar aquí.
    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Stripe pide el precio en CENTAVOS (unit_amount), no en pesos
    // — por eso × 100. Cada línea del carrito se vuelve un
    // "line_item" independiente, con su propio nombre y precio.
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: { name: `${item.name} — ${item.sizeLabel}` },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // "oxxo" habilita el voucher de pago en efectivo en tiendas
      // OXXO, además de tarjeta. El pago con OXXO NO es inmediato
      // — se confirma después, vía webhook (Bloque 8).
      payment_method_types: ["card", "oxxo"],
      line_items: lineItems,
      customer_email: customerEmail || undefined,
      // metadata conecta esta sesión de Stripe con TU pedido en
      // Supabase — así, cuando llegue la notificación de pago,
      // sabemos a qué orden pertenece.
      metadata: { orderId },
      success_url: "https://carlosnm0802.github.io/aegon-perfumes/confirmacion.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://carlosnm0802.github.io/aegon-perfumes/checkout.html",
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creando la sesión de Stripe:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
