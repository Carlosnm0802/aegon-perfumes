import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";

// ============================================================
// EDGE FUNCTION: verificar-pago
// ============================================================
// Recibe un sessionId de Stripe Checkout y devuelve su estado
// real de pago. La usa confirmacion.js para saber si mostrar
// "pago confirmado" o "voucher OXXO pendiente".
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
    const { sessionId } = await req.json();

    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("Falta configurar el secreto STRIPE_SECRET_KEY en Supabase.");
    }

    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // payment_status puede ser 'paid' (tarjeta, o OXXO ya pagado),
    // 'unpaid' (voucher OXXO generado pero aún no pagado), o
    // 'no_payment_required'.
    return new Response(
      JSON.stringify({
        payment_status: session.payment_status,
        amount_total: session.amount_total,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verificando el pago:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});