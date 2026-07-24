import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';

const PAGE_SIZE = 10;

let testimonios = [];
let paginaActual = 1;
let totalPaginas = 1;

const filtros = {
  busqueda: '',
  rating: '',
  visibilidad: 'all',
};

function estrellas(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function sanitizarTexto(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function setStatusAccionMasiva(texto, esError = false) {
  const status = document.getElementById('admin-testimonios-bulk-status');
  if (!status) return;

  status.textContent = texto;
  status.hidden = false;
  status.classList.toggle('is-error', esError);
}

function actualizarEstadoPaginacion() {
  const info = document.getElementById('admin-testimonios-page-info');
  const prev = document.getElementById('admin-testimonios-prev');
  const next = document.getElementById('admin-testimonios-next');
  if (!info || !prev || !next) return;

  info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  prev.disabled = paginaActual <= 1;
  next.disabled = paginaActual >= totalPaginas;
}

function renderizarTestimonios(lista) {
  const contenedor = document.getElementById('admin-testimonios-lista');
  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.innerHTML = '<p>No hay testimonios con los filtros actuales.</p>';
    return;
  }

  contenedor.innerHTML = lista.map((item) => `
    <article class="admin-testimonio-card">
      <div class="admin-testimonio-card__head">
        <div>
          <div class="admin-testimonio-card__name">${sanitizarTexto(item.customer_name)}</div>
          <div class="admin-testimonio-card__meta">${formatearFecha(item.created_at)} · ${estrellas(item.rating)}</div>
        </div>
        <label class="admin-testimonio-card__toggle">
          <input type="checkbox" data-testimonio-visible="${item.id}" ${item.is_visible ? 'checked' : ''}>
          Visible
        </label>
      </div>
      <p class="admin-testimonio-card__text">${sanitizarTexto(item.opinion)}</p>
    </article>
  `).join('');

  contenedor.querySelectorAll('[data-testimonio-visible]').forEach((check) => {
    check.addEventListener('change', async () => {
      const id = check.dataset.testimonioVisible;
      const visible = check.checked;
      await actualizarVisibilidad(id, visible);
    });
  });
}

function construirConsultaBase() {
  let query = supabaseClient
    .from('testimonials')
    .select('id, customer_name, rating, opinion, is_visible, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filtros.busqueda) {
    const termino = `%${filtros.busqueda}%`;
    query = query.or(`customer_name.ilike.${termino},opinion.ilike.${termino}`);
  }

  if (filtros.rating) {
    query = query.eq('rating', Number(filtros.rating));
  }

  if (filtros.visibilidad === 'visible') {
    query = query.eq('is_visible', true);
  }

  if (filtros.visibilidad === 'hidden') {
    query = query.eq('is_visible', false);
  }

  return query;
}

async function cargarTestimonios() {
  const contenedor = document.getElementById('admin-testimonios-lista');
  if (!contenedor) return;

  const desde = (paginaActual - 1) * PAGE_SIZE;
  const hasta = desde + PAGE_SIZE - 1;

  const { data, count, error } = await construirConsultaBase().range(desde, hasta);

  if (error) {
    console.error('Error cargando testimonios:', error);
    contenedor.innerHTML = '<p>No pudimos cargar testimonios.</p>';
    totalPaginas = 1;
    actualizarEstadoPaginacion();
    return;
  }

  totalPaginas = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  if (paginaActual > totalPaginas) {
    paginaActual = totalPaginas;
    return cargarTestimonios();
  }

  testimonios = data ?? [];
  renderizarTestimonios(testimonios);
  actualizarEstadoPaginacion();
}

async function actualizarVisibilidad(id, isVisible) {
  const { error } = await supabaseClient
    .from('testimonials')
    .update({ is_visible: isVisible })
    .eq('id', id);

  if (error) {
    console.error('Error actualizando visibilidad del testimonio:', error);
    return;
  }

  testimonios = testimonios.map((item) => (
    item.id === id ? { ...item, is_visible: isVisible } : item
  ));

  if (
    (filtros.visibilidad === 'visible' && !isVisible)
    || (filtros.visibilidad === 'hidden' && isVisible)
  ) {
    await cargarTestimonios();
  }
}

async function ocultarResenasUnaEstrella() {
  const confirmar = window.confirm('Esto ocultará todas las reseñas de 1 estrella. ¿Deseas continuar?');
  if (!confirmar) return;

  const { data, error } = await supabaseClient
    .from('testimonials')
    .update({ is_visible: false })
    .eq('rating', 1)
    .eq('is_visible', true)
    .select('id');

  if (error) {
    console.error('Error ocultando reseñas de 1 estrella:', error);
    setStatusAccionMasiva('No pudimos ocultar las reseñas de 1 estrella.', true);
    return;
  }

  const afectadas = data?.length ?? 0;
  setStatusAccionMasiva(`Se ocultaron ${afectadas} reseñas de 1 estrella.`);
  paginaActual = 1;
  await cargarTestimonios();
}

async function publicarTestimoniosOcultos() {
  const confirmar = window.confirm('Esto publicará todos los testimonios ocultos. ¿Deseas continuar?');
  if (!confirmar) return;

  const { data, error } = await supabaseClient
    .from('testimonials')
    .update({ is_visible: true })
    .eq('is_visible', false)
    .select('id');

  if (error) {
    console.error('Error publicando testimonios ocultos:', error);
    setStatusAccionMasiva('No pudimos publicar los testimonios ocultos.', true);
    return;
  }

  const afectadas = data?.length ?? 0;
  setStatusAccionMasiva(`Se publicaron ${afectadas} testimonios ocultos.`);
  paginaActual = 1;
  await cargarTestimonios();
}

function activarControles() {
  const input = document.getElementById('admin-buscar-testimonio');
  const rating = document.getElementById('admin-filtro-rating');
  const visibilidad = document.getElementById('admin-filtro-visibilidad');
  const prev = document.getElementById('admin-testimonios-prev');
  const next = document.getElementById('admin-testimonios-next');
  const btnHide1Star = document.getElementById('admin-testimonios-hide-1star');
  const btnShowHidden = document.getElementById('admin-testimonios-show-hidden');

  if (!input || !rating || !visibilidad || !prev || !next || !btnHide1Star || !btnShowHidden) return;

  const onCambioFiltros = () => {
    filtros.busqueda = input.value.trim();
    filtros.rating = rating.value;
    filtros.visibilidad = visibilidad.value;
    paginaActual = 1;
    cargarTestimonios();
  };

  input.addEventListener('input', onCambioFiltros);
  rating.addEventListener('change', onCambioFiltros);
  visibilidad.addEventListener('change', onCambioFiltros);

  prev.addEventListener('click', () => {
    if (paginaActual <= 1) return;
    paginaActual -= 1;
    cargarTestimonios();
  });

  next.addEventListener('click', () => {
    if (paginaActual >= totalPaginas) return;
    paginaActual += 1;
    cargarTestimonios();
  });

  btnHide1Star.addEventListener('click', ocultarResenasUnaEstrella);
  btnShowHidden.addEventListener('click', publicarTestimoniosOcultos);

  actualizarEstadoPaginacion();
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('testimonios');
  activarAdminHeader();
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  activarControles();
  await cargarTestimonios();
}

document.addEventListener('DOMContentLoaded', iniciar);
