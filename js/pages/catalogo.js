import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderLoader } from '../components/loader.js';
import { renderLayout } from '../components/layout.js';
import { renderFilterPanel, activarPanelFiltros } from '../components/filter-panel.js';

const PRODUCTOS_POR_PAGINA = 12;

let filtros = { categoria: '', tipo: '', precio: '', marcas: [] };
let paginaActual = 0;

// ============================================================
// CARGA INICIAL: categorías y marcas para poblar el panel
// ============================================================
async function cargarOpcionesDeFiltro() {
  const [{ data: categorias }, { data: marcas }] = await Promise.all([
    supabaseClient.from('categories').select('name, slug').order('name'),
    supabaseClient.from('brands').select('name, slug').order('name'),
  ]);
  return { categorias: categorias ?? [], marcas: marcas ?? [] };
}

// Lee ?categoria=arabe de la URL (llegada desde el Home) y la
// aplica como filtro inicial, reflejándola en el pill correcto.
function aplicarFiltroDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const categoria = params.get('categoria');
  if (!categoria) return;

  filtros.categoria = categoria;

  const pill = document.querySelector(
    `.filter-pills[data-filter-group="categoria"] .filter-pill[data-value="${categoria}"]`
  );
  if (pill) {
    document.querySelectorAll('.filter-pills[data-filter-group="categoria"] .filter-pill')
      .forEach(p => p.setAttribute('aria-pressed', 'false'));
    pill.setAttribute('aria-pressed', 'true');
  }
}

// Traduce el rango elegido ("500-1000", "2000-") a valores
// mínimo/máximo utilizables en la consulta.
function parsearRangoPrecio(valor) {
  if (!valor) return null;
  const [min, max] = valor.split('-');
  return { min: Number(min), max: max ? Number(max) : null };
}

// ============================================================
// CONSTRUCCIÓN DE LA CONSULTA A SUPABASE
// ============================================================
// category, brand y variants se piden con !inner porque
// filtramos sobre esos campos embebidos — PostgREST lo exige
// para poder aplicar .eq()/.in() sobre una tabla relacionada.
//
// Con variants!inner, además de mostrarlas, Supabase filtra:
// devuelve el producto solo si tiene AL MENOS una variante que
// cumple el filtro, y el array `variants` que llega al frontend
// viene YA recortado a esas coincidencias — por eso no hace
// falta tocar product-card.js para nada.
// ============================================================
function construirConsulta() {
  let query = supabaseClient
    .from('products')
    .select(`
      id, name, image_url,
      brand:brands!inner(name, slug),
      category:categories!inner(name, slug),
      variants!inner(id, size_label, price, available, type)
    `)
    .order('created_at', { ascending: false });

  if (filtros.categoria) {
    query = query.eq('category.slug', filtros.categoria);
  }
  if (filtros.marcas.length > 0) {
    query = query.in('brand.slug', filtros.marcas);
  }
  if (filtros.tipo) {
    query = query.eq('variants.type', filtros.tipo);
  }
  const rango = parsearRangoPrecio(filtros.precio);
  if (rango) {
    query = query.gte('variants.price', rango.min);
    if (rango.max !== null) query = query.lte('variants.price', rango.max);
  }

  const desde = paginaActual * PRODUCTOS_POR_PAGINA;
  const hasta = desde + PRODUCTOS_POR_PAGINA - 1;
  return query.range(desde, hasta);
}

// ============================================================
// CARGA Y RENDERIZADO
// ============================================================
async function cargarProductos({ reset = false } = {}) {
  const grid = document.querySelector('.catalog-grid');
  const btnCargarMas = document.getElementById('btn-cargar-mas');
  const mensajeVacio = document.getElementById('catalog-empty');

  if (reset) {
    paginaActual = 0;
    grid.innerHTML = renderLoader(PRODUCTOS_POR_PAGINA);
    mensajeVacio.hidden = true;
  }

  const { data: products, error } = await construirConsulta();

  if (error) {
    console.error('Error cargando el catálogo desde Supabase:', error);
    return;
  }

  if (reset) grid.innerHTML = '';

  if (reset && products.length === 0) {
    mensajeVacio.hidden = false;
    btnCargarMas.hidden = true;
    return;
  }

  grid.insertAdjacentHTML('beforeend', products.map(renderProductCard).join(''));

  // Solo activamos el selector de variante en las tarjetas nuevas
  // (data-activado evita re-adjuntar listeners a las que ya
  // llegaron en una página anterior de "Cargar más").
  grid.querySelectorAll('.product-card:not([data-activado])').forEach(card => {
    activarSelectorDeVariante(card);
    card.setAttribute('data-activado', 'true');
  });

  btnCargarMas.hidden = products.length < PRODUCTOS_POR_PAGINA;
  paginaActual++;
}

// ============================================================
// LEE EL ESTADO DEL PANEL Y LO CONVIERTE EN `filtros`
// ============================================================
function leerFiltrosDelPanel() {
  const leerGrupo = (grupo) => {
    const activo = document.querySelector(
      `.filter-pills[data-filter-group="${grupo}"] .filter-pill[aria-pressed="true"]`
    );
    return activo ? activo.dataset.value : '';
  };

  filtros = {
    categoria: leerGrupo('categoria'),
    tipo: leerGrupo('tipo'),
    precio: leerGrupo('precio'),
    marcas: [...document.querySelectorAll('input[name="marca"]:checked')].map(el => el.value),
  };
}

function limpiarPanel() {
  document.querySelectorAll('.filter-pill').forEach(p => p.setAttribute('aria-pressed', 'false'));
  document.querySelectorAll('.filter-pills[data-filter-group] .filter-pill[data-value=""]')
    .forEach(p => p.setAttribute('aria-pressed', 'true'));
  document.querySelectorAll('input[name="marca"]').forEach(cb => { cb.checked = false; });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
async function iniciarCatalogo() {
  renderLayout();

  const { categorias, marcas } = await cargarOpcionesDeFiltro();
  document.getElementById('filter-panel-container').innerHTML = renderFilterPanel(categorias, marcas);
  activarPanelFiltros();

  aplicarFiltroDesdeURL();

  document.getElementById('filter-aplicar').addEventListener('click', () => {
    leerFiltrosDelPanel();
    cargarProductos({ reset: true });
    document.getElementById('filter-overlay').classList.remove('is-visible');
    document.getElementById('filter-panel').classList.remove('is-visible');
  });

  document.getElementById('filter-limpiar').addEventListener('click', limpiarPanel);

  document.getElementById('btn-cargar-mas').addEventListener('click', () => {
    cargarProductos({ reset: false });
  });

  cargarProductos({ reset: true });
}

document.addEventListener('DOMContentLoaded', iniciarCatalogo);