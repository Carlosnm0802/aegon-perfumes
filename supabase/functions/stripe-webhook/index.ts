import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ============================================================
// EDGE FUNCTION: stripe-webhook
// ============================================================
// Stripe llama a ESTA función automáticamente cuando algo pasa
// con un pago — no la llama nuestro frontend nunca. Escuchamos
// 2 eventos, porque el pago puede confirmarse en 2 momentos
// distintos:
//
// - checkout.session.completed: con TARJETA, esto ya significa
//   pagado. Con OXXO, este evento llega de inmediato pero solo
//   significa "se generó el voucher" — el pago sigue pendiente.
// - checkout.session.async_payment_succeeded: este es el que
//   confirma que un pago DIFERIDO (OXXO) ya se completó de
//   verdad, cuando el cliente paga en la tienda física.
//
// [ALERTA] Usa la Service Role Key (inyectada automáticamente
// por Supabase, no hay que configurarla) porque `orders` es de
// solo-INSERT para el público — este es el único lugar del
// proyecto que puede actualizar pedidos, y solo lo hace tras
// verificar la firma criptográfica de Stripe.
// ============================================================

const secretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(secretKey, {
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event;
  try {
    // Esto verifica que la petición realmente viene de Stripe (y
    // no de alguien tratando de marcar pedidos como pagados sin
    // haber pagado) — usando el secreto de firma del webhook.
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (error) {
    console.error("Firma de webhook inválida:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;

    if (session.payment_status === "paid") {
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "preparando" })
          .eq("id", orderId);

        if (error) {
          console.error("Error actualizando el pedido:", error);
        }
      } else {
        console.error("La sesión de Stripe no traía orderId en metadata.");
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});