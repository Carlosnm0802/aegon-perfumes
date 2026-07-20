import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader } from './admin-header.js';

const ETIQUETAS_ENTREGA = {
  local: 'Recoger en persona',
  envio_local: 'Envío local',
  paqueteria: 'Paquetería nacional',
};

let filtroEstado = '';

function formatearFecha(fechaISO) {
  return new Date(fechaISO).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-MX')} MXN`;
}

// ============================================================
// TARJETA DE PEDIDO
// ============================================================
// Colapsada por defecto (nombre, total, estado) — se expande al
// hacer clic para ver el detalle completo (productos, teléfono,
// dirección). Evita que la lista se vuelva enorme de scrollear
// cuando haya muchos pedidos.
// ============================================================

function renderPedidoCard(pedido) {
  const itemsHtml = pedido.order_items.map(item => `
    <div class="admin-pedido-item">
      <span>${item.variant?.product?.name ?? 'Producto eliminado'} — ${item.variant?.size_label ?? ''} × ${item.quantity}</span>
      <span>${formatearPrecio(item.unit_price * item.quantity)}</span>
    </div>
  `).join('');

  return `
    <div class="admin-pedido-card" data-pedido-id="${pedido.id}">
      <div class="admin-pedido-card__resumen">
        <div class="admin-pedido-card__cliente">
          <strong>${pedido.customer_name}</strong>
          <span class="admin-pedido-card__fecha">${formatearFecha(pedido.created_at)}</span>
        </div>
        <div class="admin-pedido-card__total">${formatearPrecio(pedido.total)}</div>
        <span class="status-pill status-${pedido.status}">${pedido.status}</span>
        <button type="button" class="admin-pedido-card__toggle" aria-label="Ver detalle">▾</button>
      </div>

      <div class="admin-pedido-card__detalle" hidden>
        <p><strong>Teléfono:</strong> ${pedido.customer_phone}</p>
        ${pedido.customer_email ? `<p><strong>Correo:</strong> ${pedido.customer_email}</p>` : ''}
        <p><strong>Entrega:</strong> ${ETIQUETAS_ENTREGA[pedido.delivery_type] ?? pedido.delivery_type}</p>
        ${pedido.delivery_address ? `<p><strong>Dirección:</strong> ${pedido.delivery_address}</p>` : ''}

        <div class="admin-pedido-items">${itemsHtml}</div>

        <div class="admin-pedido-card__acciones">
          <select class="admin-pedido-card__status-select">
            <option value="pendiente" ${pedido.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="preparando" ${pedido.status === 'preparando' ? 'selected' : ''}>Preparando</option>
            <option value="enviado" ${pedido.status === 'enviado' ? 'selected' : ''}>Enviado</option>
            <option value="entregado" ${pedido.status === 'entregado' ? 'selected' : ''}>Entregado</option>
          </select>
          <button class="btn btn-primary admin-pedido-card__guardar">Actualizar estado</button>
          <span class="admin-pedido-card__estado-guardado" hidden></span>
        </div>
      </div>
    </div>
  `;
}

function activarPedidoCard(card) {
  const pedidoId = card.dataset.pedidoId;
  const resumen = card.querySelector('.admin-pedido-card__resumen');
  const detalle = card.querySelector('.admin-pedido-card__detalle');
  const toggle = card.querySelector('.admin-pedido-card__toggle');
  const selectEstado = card.querySelector('.admin-pedido-card__status-select');
  const btnGuardar = card.querySelector('.admin-pedido-card__guardar');
  const estadoGuardado = card.querySelector('.admin-pedido-card__estado-guardado');
  const badgeEstado = card.querySelector('.status-pill');

  resumen.addEventListener('click', (e) => {
    if (e.target === selectEstado) return; // no colapsar al usar el select
    const abierto = !detalle.hidden;
    detalle.hidden = abierto;
    toggle.textContent = abierto ? '▾' : '▴';
  });

  btnGuardar.addEventListener('click', async () => {
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    const nuevoEstado = selectEstado.value;
    const { error } = await supabaseClient
      .from('orders')
      .update({ status: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error actualizando el pedido:', error);
      estadoGuardado.textContent = 'Error al guardar.';
    } else {
      badgeEstado.textContent = nuevoEstado;
      badgeEstado.className = `status-pill status-${nuevoEstado}`;
      estadoGuardado.textContent = '✓ Actualizado';
    }

    estadoGuardado.hidden = false;
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Actualizar estado';
  });
}

// ============================================================
// CARGA Y FILTRO
// ============================================================
async function cargarPedidos() {
  const contenedor = document.getElementById('admin-pedidos-lista');
  contenedor.innerHTML = '<p>Cargando pedidos...</p>';

  let query = supabaseClient
    .from('orders')
    .select(`
      id, customer_name, customer_phone, customer_email,
      delivery_type, delivery_address, status, total, created_at,
      order_items(quantity, unit_price, variant:variants(size_label, product:products(name)))
    `)
    .order('created_at', { ascending: false });

  if (filtroEstado) {
    query = query.eq('status', filtroEstado);
  }

  const { data: pedidos, error } = await query;

  if (error) {
    console.error('Error cargando pedidos:', error);
    contenedor.innerHTML = '<p>No pudimos cargar los pedidos.</p>';
    return;
  }

  if (pedidos.length === 0) {
    contenedor.innerHTML = '<p>No hay pedidos con este filtro.</p>';
    return;
  }

  contenedor.innerHTML = pedidos.map(renderPedidoCard).join('');
  contenedor.querySelectorAll('.admin-pedido-card').forEach(activarPedidoCard);
}

function activarFiltro() {
  document.querySelectorAll('.admin-pedidos-filtro .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.admin-pedidos-filtro .filter-pill')
        .forEach(p => p.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');
      filtroEstado = pill.dataset.value;
      cargarPedidos();
    });
  });
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('pedidos');
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  activarFiltro();
  cargarPedidos();
}

document.addEventListener('DOMContentLoaded', iniciar);