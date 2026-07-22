import { supabaseClient } from '../supabase-client.js';
import { renderLayout } from '../components/layout.js';
import { obtenerWhatsappNumber } from '../settings.js';

// ============================================================
// PÁGINA: CONFIRMACIÓN
// ============================================================
// Lee ?session_id= de la URL (Stripe lo agrega automáticamente
// al redirigir) y le pregunta a la Edge Function verificar-pago
// si ya está pagado — no leemos esto de Supabase directamente
// porque `orders` es intencionalmente de solo-INSERT para el
// público (nadie puede leer pedidos, ni el propio).
// ============================================================

function renderBotonWhatsApp(numeroWhatsapp, mensaje) {
  const texto = encodeURIComponent(mensaje);
  return `<a href="https://wa.me/${numeroWhatsapp}?text=${texto}" target="_blank" rel="noopener" class="btn btn-primary">Escríbenos por WhatsApp</a>`;
}

async function iniciarConfirmacion() {
  await renderLayout();
  const numeroWhatsapp = await obtenerWhatsappNumber();

  const contenedor = document.getElementById('confirmacion-contenido');
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  if (!sessionId) {
    contenedor.innerHTML = `
      <h2>No encontramos tu pedido</h2>
      <p>Si acabas de comprar y ves esto, escríbenos por WhatsApp con tu nombre y te ayudamos a confirmarlo.</p>
      ${renderBotonWhatsApp(numeroWhatsapp, 'Hola, no me llegó la confirmación de mi pedido')}
    `;
    return;
  }

  const { data, error } = await supabaseClient.functions.invoke('verificar-pago', {
    body: { sessionId },
  });

  if (error || !data) {
    console.error('Error verificando el pago:', error);
    contenedor.innerHTML = `
      <h2>No pudimos confirmar tu pago</h2>
      <p>Si ya pagaste, no te preocupes — escríbenos por WhatsApp y lo confirmamos manualmente.</p>
      ${renderBotonWhatsApp(numeroWhatsapp, 'Hola, hice un pedido y quiero confirmar mi pago')}
    `;
    return;
  }

  if (data.payment_status === 'paid') {
    contenedor.innerHTML = `
      <h2>¡Pago confirmado!</h2>
      <p>Gracias por tu compra. En breve empezamos a preparar tu pedido.</p>
      ${renderBotonWhatsApp(numeroWhatsapp, 'Hola, ya realicé mi pago, quiero confirmar mi pedido')}
    `;
  } else {
    contenedor.innerHTML = `
      <h2>Tu pedido está registrado</h2>
      <p>Si elegiste pagar en OXXO, tienes unos días para completar el pago con el voucher que se te mostró. En cuanto se confirme, empezamos a preparar tu pedido.</p>
      ${renderBotonWhatsApp(numeroWhatsapp, 'Hola, tengo una duda sobre mi pedido y el pago en OXXO')}
    `;
  }
}

document.addEventListener('DOMContentLoaded', iniciarConfirmacion);