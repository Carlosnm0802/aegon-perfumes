import { supabaseClient } from '../supabase-client.js';
import { renderLayout } from '../components/layout.js';
import { obtenerCarrito, calcularTotal, vaciarCarrito, eliminarDelCarrito } from '../cart.js';
import { formatearPrecio } from '../utils/format.js';
import { WHATSAPP_NUMBER } from '../config.js';

// ============================================================
// PÁGINA: CHECKOUT
// ============================================================
// Lee el carrito de localStorage, muestra el resumen y prepara un
// mensaje para que el cliente confirme el pedido por WhatsApp.
// ============================================================

const COSTO_ENVIO = 160;
const LIMITE_ENVIO_GRATIS = 1000;
const TEXTO_BOTON_WHATSAPP = 'Enviar pedido por WhatsApp';

/**
 * Calcula el cargo de envío según subtotal y tipo de entrega.
 * @param {number} subtotal - importe de los productos
 * @param {string} deliveryType - tipo de entrega seleccionado
 * @returns {number} cargo de envío aplicable
 */
function calcularCostoEnvio(subtotal, deliveryType) {
  const esEnvio = deliveryType !== 'local';
  return esEnvio && subtotal <= LIMITE_ENVIO_GRATIS ? COSTO_ENVIO : 0;
}

function renderAvisoEnvio(carrito, deliveryType) {
  const contenedor = document.getElementById('shipping-progress-container');
  if (!contenedor) return;

  const subtotal = calcularTotal(carrito);
  const esRecogida = deliveryType === 'local';
  const montoFaltante = Math.max(0, LIMITE_ENVIO_GRATIS - subtotal);

  if (esRecogida) {
    contenedor.innerHTML = `
      <aside class="shipping-progress shipping-progress--pickup" aria-live="polite">
        <strong>Recogida en persona</strong>
        <span>Sin costo de envío</span>
      </aside>
    `;
    return;
  }

  const envioGratis = montoFaltante === 0;
  contenedor.innerHTML = `
    <aside class="shipping-progress ${envioGratis ? 'shipping-progress--unlocked' : ''}" aria-live="polite">
      <div class="shipping-progress__copy">
        <strong>${envioGratis ? '¡Envío gratis desbloqueado!' : `Te faltan ${formatearPrecio(montoFaltante)} para envío gratis`}</strong>
        <span>${envioGratis ? 'Aplica para envíos local y nacional.' : `Envío estándar: ${formatearPrecio(COSTO_ENVIO)}`}</span>
      </div>
      <div class="shipping-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="${LIMITE_ENVIO_GRATIS}" aria-valuenow="${Math.min(subtotal, LIMITE_ENVIO_GRATIS)}">
        <span style="width:${Math.min(100, (subtotal / LIMITE_ENVIO_GRATIS) * 100)}%"></span>
      </div>
    </aside>
  `;
}

function renderResumenPedido(carrito, deliveryType = 'local') {
  const contenedorItems = document.getElementById('checkout-items');
  const filaTotal = document.getElementById('checkout-total-row');
  const subtotal = calcularTotal(carrito);
  const envio = calcularCostoEnvio(subtotal, deliveryType);
  const total = subtotal + envio;

  renderAvisoEnvio(carrito, deliveryType);

  contenedorItems.innerHTML = carrito.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" width="64" height="64">
      <div class="cart-item__info">
        <div class="cart-item__brand">${item.brand}</div>
        <div class="cart-item__name">${item.name} — ${item.sizeLabel} × ${item.quantity}</div>
        <div class="cart-item__price">${formatearPrecio(item.price * item.quantity)}</div>
      </div>
    </div>
  `).join('');

  filaTotal.innerHTML = `
    <div class="checkout-total-line">
      <span>Subtotal</span><span>${formatearPrecio(subtotal)}</span>
    </div>
    <div class="checkout-total-line">
      <span>Envío</span><span>${envio ? formatearPrecio(envio) : 'Gratis'}</span>
    </div>
    <div class="checkout-total-line checkout-total-line--grand">
      <strong>Total</strong><strong>${formatearPrecio(total)}</strong>
    </div>
  `;
}

// Muestra/oculta el campo de dirección según el tipo de entrega
// elegido — no tiene sentido pedir dirección para "recoger en
// persona".
function activarCampoDireccion() {
  const selectEntrega = document.getElementById('input-entrega');
  const campoDireccion = document.getElementById('campo-direccion');
  const inputDireccion = document.getElementById('input-direccion');

  function actualizar() {
    const requiereDireccion = selectEntrega.value !== 'local';
    campoDireccion.hidden = !requiereDireccion;
    inputDireccion.required = requiereDireccion;
    if (!requiereDireccion) inputDireccion.value = '';
  }

  selectEntrega.addEventListener('change', actualizar);
  actualizar(); // estado inicial, por si el navegador recuerda una selección previa
}

function mostrarError(mensaje) {
  const contenedor = document.getElementById('checkout-error');
  contenedor.textContent = mensaje;
  contenedor.hidden = false;
}

function ocultarError() {
  document.getElementById('checkout-error').hidden = true;
}

function actualizarVistaCheckoutSegunCarrito(carrito) {
  const vacio = carrito.length === 0;
  document.getElementById('checkout-empty').hidden = !vacio;
  document.getElementById('checkout-content').hidden = vacio;
}

function construirMensajeItemsInactivos(removidos) {
  const etiquetas = [...new Set(removidos.map(item => `${item.name} (${item.sizeLabel})`))];
  if (etiquetas.length === 0) {
    return 'Actualizamos tu carrito: algunos productos ya no están disponibles.';
  }

  const vistaPrevia = etiquetas.slice(0, 2).join(', ');
  const restantes = etiquetas.length - 2;
  const sufijo = restantes > 0 ? ` y ${restantes} más` : '';

  return `Actualizamos tu carrito: quitamos productos no disponibles (${vistaPrevia}${sufijo}).`;
}

async function validarYDepurarCarrito(carrito) {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    return { carritoValido: [], removidos: [] };
  }

  const variantIds = [...new Set(carrito.map(item => item.variantId).filter(Boolean))];
  if (variantIds.length === 0) {
    return { carritoValido: [], removidos: [...carrito] };
  }

  const { data: variantesVigentes, error } = await supabaseClient
    .from('variants')
    .select('id, available, product:products!inner(id, name, is_active)')
    .in('id', variantIds);

  if (error) {
    throw error;
  }

  const vigentesPorId = new Map((variantesVigentes ?? []).map(v => [v.id, v]));

  const removidos = carrito.filter(item => {
    const variante = vigentesPorId.get(item.variantId);
    if (!variante) return true;
    if (!variante.available) return true;
    if (variante.product?.is_active === false) return true;
    return false;
  });

  if (removidos.length > 0) {
    const idsRemovidos = [...new Set(removidos.map(item => item.variantId))];
    idsRemovidos.forEach(id => eliminarDelCarrito(id));
  }

  return { carritoValido: obtenerCarrito(), removidos };
}

function renderDatosTransferencia(datos) {
  document.getElementById('transfer-bank').textContent = datos.bankName || 'Por definir';
  document.getElementById('transfer-holder').textContent = datos.accountHolder || 'Por definir';
  document.getElementById('transfer-account').textContent = datos.accountNumber || 'Por definir';
  document.getElementById('transfer-note').textContent = datos.note || 'Usa tu numero de pedido como concepto y envia comprobante por WhatsApp.';
}

/**
 * Construye el texto de WhatsApp a partir del carrito y los datos del cliente.
 * @param {Array} cartItems - productos con nombre, variante, cantidad y precio
 * @param {Object} customerInfo - nombre, tipo de entrega y dirección opcional
 * @param {number} total - total final, incluyendo envío
 * @param {number} shippingFee - cargo de envío aplicado
 * @returns {string} mensaje listo para compartir
 */
function buildWhatsAppMessage(cartItems, customerInfo, total, shippingFee) {
  const items = cartItems.map(item =>
    `- ${item.name} — ${item.sizeLabel} x${item.quantity} · ${formatearPrecio(item.price * item.quantity)}`
  ).join('\n');
  const direccion = customerInfo.deliveryAddress
    ? `\nDirección: ${customerInfo.deliveryAddress}`
    : '';

  return [
    'Hola, quiero confirmar este pedido:',
    '',
    `Nombre: ${customerInfo.name}`,
    `Entrega: ${customerInfo.deliveryType}${direccion}`,
    '',
    items,
    '',
    `Envío: ${shippingFee ? formatearPrecio(shippingFee) : 'Gratis'}`,
    `Total: ${formatearPrecio(total)}`,
  ].join('\n');
}

/**
 * Genera el enlace de WhatsApp con el pedido prellenado.
 * @param {Array} cartItems - productos del carrito
 * @param {Object} customerInfo - datos de contacto y entrega
 * @param {number} total - total final del pedido
 * @param {number} shippingFee - cargo de envío aplicado
 * @returns {string} URL completa de WhatsApp
 */
function buildWhatsAppLink(cartItems, customerInfo, total, shippingFee) {
  const message = buildWhatsAppMessage(cartItems, customerInfo, total, shippingFee);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function registrarPedido(carrito, datosCliente, total) {
  const { data: orderId, error } = await supabaseClient.rpc('create_public_order', {
    p_customer_name: datosCliente.customer_name,
    p_customer_phone: datosCliente.customer_phone,
    p_customer_email: datosCliente.customer_email || null,
    p_delivery_type: datosCliente.delivery_type,
    p_delivery_address: datosCliente.delivery_address || null,
    p_total: total,
    p_items: carrito.map(item => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    console.error('Detalle del error al registrar pedido:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message || 'No se pudo registrar el pedido.');
  }
  return orderId;
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
async function iniciarCheckout() {
  await renderLayout();

  let carrito = obtenerCarrito();

  try {
    const { carritoValido, removidos } = await validarYDepurarCarrito(carrito);
    carrito = carritoValido;
    if (removidos.length > 0) {
      mostrarError(construirMensajeItemsInactivos(removidos));
    }
  } catch (error) {
    console.error('Error validando productos del carrito:', error);
    mostrarError('No pudimos validar disponibilidad de productos. Intenta de nuevo en unos segundos.');
  }

  if (carrito.length === 0) {
    actualizarVistaCheckoutSegunCarrito(carrito);
    return;
  }

  actualizarVistaCheckoutSegunCarrito(carrito);
  activarCampoDireccion();
  renderResumenPedido(carrito, document.getElementById('input-entrega').value);

  const form = document.getElementById('checkout-form');
  const btnConfirmar = document.getElementById('btn-confirmar-pedido');
  const selectEntrega = document.getElementById('input-entrega');
  const selectMetodoPago = document.getElementById('input-metodo-pago');

  selectEntrega.addEventListener('change', () => {
    renderResumenPedido(obtenerCarrito(), selectEntrega.value);
  });

  window.addEventListener('carrito:actualizado', () => {
    const carritoActual = obtenerCarrito();
    actualizarVistaCheckoutSegunCarrito(carritoActual);
    if (carritoActual.length > 0) {
      renderResumenPedido(carritoActual, selectEntrega.value);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();

    const datosCliente = {
      customer_name: document.getElementById('input-nombre').value.trim(),
      customer_phone: document.getElementById('input-telefono').value.trim(),
      customer_email: document.getElementById('input-email').value.trim(),
      delivery_type: document.getElementById('input-entrega').value,
      delivery_address: document.getElementById('input-direccion').value.trim(),
    };

    if (!datosCliente.customer_name || !datosCliente.customer_phone) {
      mostrarError('Nombre y teléfono son obligatorios.');
      return;
    }
    if (datosCliente.delivery_type !== 'local' && !datosCliente.delivery_address) {
      mostrarError('Ingresa una dirección para este tipo de entrega.');
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Preparando WhatsApp...';

    try {
      const { carritoValido: carritoActual, removidos } = await validarYDepurarCarrito(obtenerCarrito());

      if (removidos.length > 0) {
        renderResumenPedido(carritoActual);
        actualizarVistaCheckoutSegunCarrito(carritoActual);
        mostrarError(construirMensajeItemsInactivos(removidos));
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = TEXTO_BOTON_WHATSAPP;
        return;
      }

      if (carritoActual.length === 0) {
        actualizarVistaCheckoutSegunCarrito(carritoActual);
        mostrarError('Tu carrito quedó vacío porque los productos ya no están disponibles.');
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = TEXTO_BOTON_WHATSAPP;
        return;
      }

      const subtotal = calcularTotal(carritoActual);
      const shippingFee = calcularCostoEnvio(subtotal, datosCliente.delivery_type);
      const total = subtotal + shippingFee;
      const orderId = await registrarPedido(carritoActual, datosCliente, total);

      if (selectMetodoPago.value === 'transferencia') {
        vaciarCarrito();
        window.location.href = `confirmacion.html?metodo=transferencia&order_id=${encodeURIComponent(orderId)}`;
        return;
      }

      const enlaceWhatsApp = buildWhatsAppLink(carritoActual, {
        name: datosCliente.customer_name,
        deliveryType: datosCliente.delivery_type,
        deliveryAddress: datosCliente.delivery_address,
      }, total, shippingFee);
      vaciarCarrito();
      window.location.href = enlaceWhatsApp;
    } catch (error) {
      console.error('Error preparando el pedido para WhatsApp:', error);
      mostrarError(error.message || 'No pudimos preparar tu pedido. Intenta de nuevo en unos segundos.');
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = TEXTO_BOTON_WHATSAPP;
    }
  });
}

document.addEventListener('DOMContentLoaded', iniciarCheckout);
