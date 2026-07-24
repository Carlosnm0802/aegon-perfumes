import { supabaseClient } from '../supabase-client.js';
import { renderLayout } from '../components/layout.js';
import { obtenerCarrito, calcularTotal, vaciarCarrito } from '../cart.js';
import { formatearPrecio } from '../utils/format.js';
import { obtenerDatosTransferencia } from '../settings.js';

// ============================================================
// PÁGINA: CHECKOUT
// ============================================================
// Lee el carrito de localStorage, muestra el resumen, valida y
// guarda el pedido en Supabase (orders + order_items).
//
// [ALERTA] Esta versión NO conectaba el pago en línea al inicio
// del bloque. Hoy ya crea la sesión en Stripe Checkout; si falla,
// el pedido queda en 'pendiente' para que el cliente pueda retomar
// el pago después (retomar-pago.html).
// ============================================================

function renderResumenPedido(carrito) {
  const contenedorItems = document.getElementById('checkout-items');
  const filaTotal = document.getElementById('checkout-total-row');

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

  filaTotal.innerHTML = `<span>Total</span><span>${formatearPrecio(calcularTotal(carrito))}</span>`;
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

function renderDatosTransferencia(datos) {
  document.getElementById('transfer-bank').textContent = datos.bankName || 'Por definir';
  document.getElementById('transfer-holder').textContent = datos.accountHolder || 'Por definir';
  document.getElementById('transfer-account').textContent = datos.accountNumber || 'Por definir';
  document.getElementById('transfer-note').textContent = datos.note || 'Usa tu numero de pedido como concepto y envia comprobante por WhatsApp.';
}

function activarMetodoPago() {
  const selectMetodo = document.getElementById('input-metodo-pago');
  const bloqueTransferencia = document.getElementById('transferencia-info');
  const btnConfirmar = document.getElementById('btn-confirmar-pedido');

  function actualizar() {
    const esTransferencia = selectMetodo.value === 'transferencia';
    bloqueTransferencia.hidden = !esTransferencia;
    btnConfirmar.textContent = esTransferencia ? 'Confirmar pedido' : 'Pagar con tarjeta';
  }

  selectMetodo.addEventListener('change', actualizar);
  actualizar();
}

// ============================================================
// GUARDAR EL PEDIDO EN SUPABASE
// ============================================================
// unit_price se toma del carrito (no de una nueva consulta) para
// conservar el precio exacto que el cliente vio al momento de
// comprar, tal como quedó decidido en Fase 4. Ver más abajo por
// qué el id se genera en el navegador en vez de pedírselo a
// Supabase de vuelta.
// ============================================================
async function guardarPedido(datosCliente, carrito) {
  // Generamos el id nosotros mismos: así no necesitamos pedirle a
  // Supabase que nos devuelva la fila recién creada (.select()),
  // algo que las políticas de RLS bloquean a propósito — nadie
  // debería poder leer pedidos, ni siquiera el que acaba de crear.
  const orderId = crypto.randomUUID();

  const { error: errorPedido } = await supabaseClient
    .from('orders')
    .insert({
      id: orderId,
      customer_name: datosCliente.customer_name,
      customer_phone: datosCliente.customer_phone,
      customer_email: datosCliente.customer_email || null,
      delivery_type: datosCliente.delivery_type,
      delivery_address: datosCliente.delivery_address || null,
      total: calcularTotal(carrito),
    });

  if (errorPedido) {
    throw errorPedido;
  }

  const itemsAInsertar = carrito.map(item => ({
    order_id: orderId,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: errorItems } = await supabaseClient
    .from('order_items')
    .insert(itemsAInsertar);

  if (errorItems) {
    throw errorItems;
  }

  return { id: orderId };
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
async function iniciarCheckout() {
  await renderLayout();

  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    document.getElementById('checkout-empty').hidden = false;
    return;
  }

  document.getElementById('checkout-content').hidden = false;
  renderResumenPedido(carrito);
  activarCampoDireccion();
  renderDatosTransferencia(await obtenerDatosTransferencia());
  activarMetodoPago();

  const form = document.getElementById('checkout-form');
  const btnConfirmar = document.getElementById('btn-confirmar-pedido');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();

    const datosCliente = {
      customer_name: document.getElementById('input-nombre').value.trim(),
      customer_phone: document.getElementById('input-telefono').value.trim(),
      customer_email: document.getElementById('input-email').value.trim(),
      delivery_type: document.getElementById('input-entrega').value,
      delivery_address: document.getElementById('input-direccion').value.trim(),
      payment_method: document.getElementById('input-metodo-pago').value,
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
    btnConfirmar.textContent = 'Guardando pedido...';

    try {
      const carritoActual = obtenerCarrito();
      const pedido = await guardarPedido(datosCliente, carritoActual);

      if (datosCliente.payment_method === 'transferencia') {
        vaciarCarrito();
        const destino = `confirmacion.html?metodo=transferencia&order_id=${encodeURIComponent(pedido.id)}`;
        window.location.href = destino;
        return;
      }

      btnConfirmar.textContent = 'Conectando con el pago...';

      // La Edge Function crea la sesión de pago usando el Secret
      // Key real de Stripe (que nunca sale de Supabase) y nos
      // devuelve la URL de checkout.
      const { data: sesion, error: errorSesion } = await supabaseClient.functions.invoke(
        'crear-sesion-pago',
        {
          body: {
            orderId: pedido.id,
            items: carritoActual,
            customerEmail: datosCliente.customer_email,
          },
        }
      );

      if (errorSesion || !sesion?.checkout_url) {
        throw errorSesion || new Error('No se recibió una URL de pago válida.');
      }

      vaciarCarrito();

      // Stripe usa la MISMA URL de checkout para modo prueba y
      // modo prueba y producción — el cambio entre uno y otro se
      // hace solo con qué Secret Key configuraste en Supabase
      // (sk_test_... vs sk_live_...), sin tocar esta línea.
      window.location.href = sesion.checkout_url;
    } catch (error) {
      console.error('Error guardando el pedido o creando el pago:', error);
      mostrarError('No pudimos procesar tu pedido. Intenta de nuevo en unos segundos.');
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Confirmar pedido';
    }
  });
}

document.addEventListener('DOMContentLoaded', iniciarCheckout);
