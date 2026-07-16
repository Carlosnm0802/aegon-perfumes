import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// EDGE FUNCTION: crear-preferencia
// ============================================================
// Recibe los datos de un pedido ya guardado en Supabase y crea
// una "preferencia de pago" en MercadoPago — el objeto que
// representa una sesión de Checkout Pro. Devuelve la URL a la
// que el navegador debe redirigir al cliente para pagar.
//
// El Access Token de MercadoPago SOLO existe aquí, como secreto
// de Supabase (Deno.env.get) — nunca llega al navegador.
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // El navegador manda una petición OPTIONS de "preflight" antes
  // del POST real cuando la petición viene de otro origen — hay
  // que responderla o el navegador bloquea la petición real.
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { orderId, items, customerName, customerEmail } = await req.json();

    const rawAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const accessToken = rawAccessToken?.trim();
    if (!accessToken) {
      throw new Error("Falta configurar el secreto MP_ACCESS_TOKEN en Supabase.");
    }

    // MercadoPago espera cada línea del carrito como un "item"
    // independiente, con su propio precio — mismo dato que ya
    // tenemos en el carrito, solo cambian los nombres de campo.
    const mpItems = items.map((item) => ({
      title: `${item.name} — ${item.sizeLabel}`,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "MXN",
    }));

    const preferencia = {
      items: mpItems,
      payer: {
        name: customerName,
        email: customerEmail || undefined,
      },
      external_reference: orderId,
      back_urls: {
        success: "https://carlosnm0802.github.io/aegon-perfumes/confirmacion.html",
        failure: "https://carlosnm0802.github.io/aegon-perfumes/checkout.html",
        pending: "https://carlosnm0802.github.io/aegon-perfumes/confirmacion.html",
      },
      auto_return: "approved",
    };

    const respuestaMP = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencia),
    });

    const datosMP = await respuestaMP.json();

    if (!respuestaMP.ok) {
      const mpErrorCode = datosMP?.code ?? "UNKNOWN_MP_ERROR";
      const mpErrorMessage = datosMP?.message ?? "MercadoPago rechazó la solicitud.";

      console.error("Error de MercadoPago:", {
        status: respuestaMP.status,
        code: mpErrorCode,
        message: mpErrorMessage,
        blocked_by: datosMP?.blocked_by,
      });

      // 403 con PA_UNAUTHORIZED_RESULT_FROM_POLICIES casi siempre
      // significa credenciales válidas, pero sin permiso operativo
      // para Checkout Pro en esa cuenta/app.
      if (respuestaMP.status === 403 && mpErrorCode === "PA_UNAUTHORIZED_RESULT_FROM_POLICIES") {
        return new Response(
          JSON.stringify({
            error: "MercadoPago bloqueó la operación por políticas de la cuenta.",
            code: mpErrorCode,
            details:
              "Verifica que la app/cuenta tenga Checkout Pro habilitado y que el Access Token pertenezca al mismo entorno (TEST o PROD).",
          }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "No se pudo crear la preferencia de pago.",
          code: mpErrorCode,
          details: mpErrorMessage,
        }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // sandbox_init_point es la URL de checkout en modo PRUEBA.
    // Con credenciales de producción, MercadoPago solo devuelve
    // init_point (sin "sandbox_"). Devolvemos ambas — el
    // frontend decide cuál usar.
    return new Response(
      JSON.stringify({
        init_point: datosMP.init_point,
        sandbox_init_point: datosMP.sandbox_init_point,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error inesperado en crear-preferencia.";
    console.error("Error en crear-preferencia:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});