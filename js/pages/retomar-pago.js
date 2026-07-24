import { supabaseClient } from '../supabase-client.js';
import { renderLayout } from '../components/layout.js';

function mostrarError(mensaje) {
  const contenedor = document.getElementById('retomar-pago-error');
  contenedor.textContent = mensaje;
  contenedor.hidden = false;
}

function ocultarError() {
  document.getElementById('retomar-pago-error').hidden = true;
}

async function iniciarRetomarPago() {
  await renderLayout();

  const form = document.getElementById('retomar-pago-form');
  const btn = document.getElementById('btn-retomar-pago');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();

    const orderId = document.getElementById('input-order-id').value.trim();
    const phone = document.getElementById('input-telefono').value.trim();

    if (!phone) {
      mostrarError('Ingresa tu teléfono para buscar tu pedido pendiente.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Validando pedido...';

    try {
      const { data, error } = await supabaseClient.functions.invoke('reintentar-pago', {
        body: { orderId: orderId || null, phone },
      });

      if (error || !data?.checkout_url) {
        throw error || new Error('No se recibió una URL de pago válida.');
      }

      btn.textContent = 'Redirigiendo a Stripe...';
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Error retomando pago:', error);
      mostrarError('No pudimos retomar este pago. Verifica número de pedido y teléfono, o contáctanos por WhatsApp.');
      btn.disabled = false;
      btn.textContent = 'Retomar pago';
    }
  });
}

document.addEventListener('DOMContentLoaded', iniciarRetomarPago);
