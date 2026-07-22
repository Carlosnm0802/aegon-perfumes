import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';

function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-MX')} MXN`;
}

// ============================================================
// MÉTRICAS PRINCIPALES
// ============================================================
// "Pagado" = cualquier pedido con estado distinto de 'pendiente'
// — recuerda que un pedido solo sale de 'pendiente' cuando el
// webhook de Stripe confirma el pago real (Bloque 8). Por eso
// "pendiente" también sirve como métrica operativa propia:
// cuántos carritos quedaron sin pago confirmado.
// ============================================================
async function cargarMetricas() {
  const { data: pedidosPagados, error: errorPedidos } = await supabaseClient
    .from('orders')
    .select('total, created_at')
    .neq('status', 'pendiente');

  const { count: pedidosPendientes } = await supabaseClient
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendiente');

  if (errorPedidos) {
    console.error('Error cargando métricas:', errorPedidos);
    return;
  }

  const ventasTotales = pedidosPagados.reduce((suma, p) => suma + Number(p.total), 0);
  const numeroPedidos = pedidosPagados.length;
  const ticketPromedio = numeroPedidos > 0 ? ventasTotales / numeroPedidos : 0;

  document.getElementById('metrica-ventas-totales').textContent = formatearPrecio(ventasTotales);
  document.getElementById('metrica-numero-pedidos').textContent = numeroPedidos;
  document.getElementById('metrica-ticket-promedio').textContent = formatearPrecio(ticketPromedio);
  document.getElementById('metrica-pendientes').textContent = pedidosPendientes ?? 0;

  renderGraficaVentasPorDia(pedidosPagados);
}

// ============================================================
// GRÁFICA: VENTAS POR DÍA (últimos 14 días)
// ============================================================
// Se arman los 14 días en 0 por defecto ANTES de sumar los
// pedidos reales — así la gráfica siempre se ve continua, sin
// huecos raros en los días sin ventas.
// ============================================================
function renderGraficaVentasPorDia(pedidos) {
  const dias = [];
  const ventasPorDia = {};

  for (let i = 13; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().split('T')[0];
    dias.push(clave);
    ventasPorDia[clave] = 0;
  }

  pedidos.forEach(p => {
    const clave = p.created_at.split('T')[0];
    if (clave in ventasPorDia) {
      ventasPorDia[clave] += Number(p.total);
    }
  });

  new Chart(document.getElementById('grafica-ventas'), {
    type: 'line',
    data: {
      labels: dias.map(d => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Ventas (MXN)',
        data: dias.map(d => ventasPorDia[d]),
        borderColor: '#C5A059',
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#A0A0A5' }, grid: { color: '#2C2C31' } },
        y: { ticks: { color: '#A0A0A5' }, grid: { color: '#2C2C31' } },
      },
    },
  });
}

// ============================================================
// GRÁFICA: PRODUCTOS MÁS VENDIDOS (top 5)
// ============================================================
async function cargarProductosMasVendidos() {
  const { data: items, error } = await supabaseClient
    .from('order_items')
    .select(`
      quantity,
      variant:variants(product:products(name)),
      order:orders!inner(status)
    `)
    .neq('order.status', 'pendiente');

  if (error) {
    console.error('Error cargando productos más vendidos:', error);
    return;
  }

  const totales = {};
  items.forEach(item => {
    const nombre = item.variant?.product?.name ?? 'Producto eliminado';
    const cantidadEntera = Number.isFinite(Number(item.quantity))
      ? Math.trunc(Number(item.quantity))
      : 0;
    totales[nombre] = (totales[nombre] ?? 0) + cantidadEntera;
  });

  const top5 = Object.entries(totales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  new Chart(document.getElementById('grafica-productos'), {
    type: 'bar',
    data: {
      labels: top5.map(([nombre]) => nombre),
      datasets: [{
        label: 'Unidades vendidas',
        data: top5.map(([, cantidad]) => cantidad),
        backgroundColor: '#C5A059',
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: {
            color: '#A0A0A5',
            precision: 0,
            stepSize: 1,
          },
          grid: { color: '#2C2C31' },
        },
        y: { ticks: { color: '#A0A0A5' }, grid: { display: false } },
      },
    },
  });
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('dashboard');
  activarAdminHeader();
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  cargarMetricas();
  cargarProductosMasVendidos();
}

document.addEventListener('DOMContentLoaded', iniciar);