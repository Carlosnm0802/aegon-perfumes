import { supabaseClient } from '../supabase-client.js';
import { renderLayout } from '../components/layout.js';
import { obtenerWhatsappNumber, obtenerDatosTransferencia } from '../settings.js';
import { formatearPrecio } from '../utils/format.js';

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

function renderNumeroPedido(orderId) {
  if (!orderId) return '';
  return `<p><strong>Numero de pedido:</strong> ${escapeHtml(orderId)}</p>`;
}

function obtenerResumenPedidoGuardado() {
  try {
    const resumen = JSON.parse(sessionStorage.getItem('aegon-last-order-summary') || 'null');
    if (!resumen || !Array.isArray(resumen.items)) return null;
    return resumen;
  } catch {
    return null;
  }
}

function construirMensajeTransferencia(orderId, resumen) {
  const idCorto = orderId.split('-')[0];
  const lineas = resumen?.items?.map(item =>
    `- ${item.name} — ${item.sizeLabel} x${item.quantity}: ${formatearPrecio(item.price * item.quantity)}`
  ) ?? [];
  const productos = lineas.length > 0 ? lineas.join('\n') : '- Productos incluidos en el pedido';
  const total = resumen?.total !== undefined ? formatearPrecio(resumen.total) : 'pendiente de confirmar';

  return [
    `Hola, ya realicé la transferencia de mi pedido #${idCorto}.`,
    '',
    'Productos:',
    productos,
    '',
    `Total pagado: ${total}`,
    '',
    'Te comparto mi comprobante.',
  ].join('\n');
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInstruccionesTransferencia(datos) {
  return `
    <div class="checkout-transferencia" style="margin-top:1rem; text-align:left;">
      <p><strong>Banco:</strong> ${escapeHtml(datos.bankName || 'Por definir')}</p>
      <p><strong>Titular:</strong> ${escapeHtml(datos.accountHolder || 'Por definir')}</p>
      <p><strong>Cuenta/CLABE:</strong> ${escapeHtml(datos.accountNumber || 'Por definir')}</p>
      <p><strong>Nota:</strong> ${escapeHtml(datos.note || 'Usa tu numero de pedido como concepto y envia comprobante por WhatsApp.')}</p>
    </div>
  `;
}

async function iniciarConfirmacion() {
  await renderLayout();
  const numeroWhatsapp = await obtenerWhatsappNumber();

  const contenedor = document.getElementById('confirmacion-contenido');
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const metodo = params.get('metodo');
  const orderId = params.get('order_id');

  if (!sessionId && metodo === 'transferencia' && orderId) {
    const transferencia = await obtenerDatosTransferencia();
    const resumen = obtenerResumenPedidoGuardado();
    const mensaje = construirMensajeTransferencia(orderId, resumen);
    const resumenHtml = resumen?.items?.length > 0
      ? `<div class="checkout-transferencia__pedido"><p><strong>Productos:</strong></p>${resumen.items.map(item => `<p>${escapeHtml(item.name)} — ${escapeHtml(item.sizeLabel)} x${item.quantity}: ${escapeHtml(formatearPrecio(item.price * item.quantity))}</p>`).join('')}<p><strong>Total: ${escapeHtml(formatearPrecio(resumen.total))}</strong></p></div>`
      : '';
    contenedor.innerHTML = `
      <h2>Pedido registrado para transferencia</h2>
      <p>Tu pedido ya esta apartado. Realiza la transferencia y envianos tu comprobante para confirmar el pago.</p>
      ${renderNumeroPedido(orderId)}
      ${resumenHtml}
      ${renderInstruccionesTransferencia(transferencia)}
      ${renderBotonWhatsApp(numeroWhatsapp, mensaje)}
    `;
    sessionStorage.removeItem('aegon-last-order-summary');
    return;
  }

  if (!sessionId) {
    contenedor.innerHTML = `
      <h2>No encontramos tu pedido</h2>
      <p>Si acabas de comprar y ves esto, escríbenos por WhatsApp con tu nombre y te ayudamos a confirmarlo.</p>
      <p>Si tu pedido quedó pendiente, puedes <a href="retomar-pago.html">retomar el pago aquí</a>.</p>
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
      ${renderNumeroPedido(data.order_id)}
      ${renderBotonWhatsApp(numeroWhatsapp, 'Hola, ya realicé mi pago, quiero confirmar mi pedido')}
    `;
  } else {
    contenedor.innerHTML = `
      <h2>Tu pedido está registrado</h2>
      <p>Si elegiste pagar en OXXO, tienes unos días para completar el pago con el voucher que se te mostró. En cuanto se confirme, empezamos a preparar tu pedido.</p>
      ${renderNumeroPedido(data.order_id)}
      ${renderBotonWhatsApp(numeroWhatsapp, 'Hola, tengo una duda sobre mi pedido y el pago en OXXO')}
    `;
  }
}

document.addEventListener('DOMContentLoaded', iniciarConfirmacion);