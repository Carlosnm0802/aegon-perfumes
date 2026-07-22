import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderLoader } from '../components/loader.js';
import { renderLayout } from '../components/layout.js';
import { renderFilterPanel, activarPanelFiltros } from '../components/filter-panel.js';

const PRODUCTOS_POR_PAGINA = 12;

let filtros = { categoria: '', tipo: '', precio: '', marcas: [], busqueda: '' };
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

// Lee ?categoria= y/o ?buscar= de la URL (llegada desde el Home
// o desde la barra de búsqueda) y los aplica como filtros
// iniciales, reflejando la categoría en el pill correcto.
function aplicarFiltroDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const categoria = params.get('categoria');
  const busqueda = params.get('buscar');

  if (categoria) {
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

  if (busqueda) {
    filtros.busqueda = busqueda;
  }

  mostrarIndicadorBusqueda();
}

// Muestra u oculta el aviso "Resultados para: X" arriba del grid,
// con un enlace para quitar la búsqueda sin perder los demás
// filtros que estén activos.
function mostrarIndicadorBusqueda() {
  const indicador = document.getElementById('catalog-search-indicator');
  if (!indicador) return;

  if (!filtros.busqueda) {
    indicador.hidden = true;
    return;
  }

  indicador.hidden = false;
  indicador.innerHTML = `
    Resultados para “${filtros.busqueda}” ·
    <a href="#" id="catalog-search-clear">Quitar</a>
  `;

  document.getElementById('catalog-search-clear').addEventListener('click', (e) => {
    e.preventDefault();
    filtros.busqueda = '';
    mostrarIndicadorBusqueda();
    cargarProductos({ reset: true });
  });
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
      variants!inner(id, size_label, price, available)
    `)
    .order('created_at', { ascending: false });

  if (filtros.categoria) {
    query = query.eq('category.slug', filtros.categoria);
  }
  if (filtros.marcas.length > 0) {
    query = query.in('brand.slug', filtros.marcas);
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
// BÚSQUEDA DE TEXTO LIBRE
// ============================================================
// Combinar en un solo .or() una columna propia (products.name)
// con una columna de una tabla relacionada (brands.name) tiene
// soporte limitado en PostgREST, sobre todo junto a los !inner
// que ya usamos para categoría/marca/variantes — puede fallar
// en silencio. En vez de eso: resolvemos primero qué marcas
// coinciden con el texto (consulta simple y confiable), y el
// filtro final del catálogo solo usa columnas de la propia tabla
// products (name, brand_id) — sin cruces frágiles.
// ============================================================
async function aplicarBusqueda(query) {
  if (!filtros.busqueda) return query;

  const termino = `%${filtros.busqueda}%`;

  const { data: marcasCoincidentes, error } = await supabaseClient
    .from('brands')
    .select('id')
    .ilike('name', termino);

  if (error) {
    console.error('Error buscando marcas coincidentes:', error);
    return query.ilike('name', termino);
  }

  const idsMarcas = (marcasCoincidentes ?? []).map(m => m.id);

  if (idsMarcas.length > 0) {
    return query.or(`name.ilike.${termino},brand_id.in.(${idsMarcas.join(',')})`);
  }
  return query.ilike('name', termino);
}

// ============================================================
// CARGA Y RENDERIZADO
// ============================================================
const MENSAJE_SIN_RESULTADOS = 'No encontramos perfumes con esos filtros. Prueba quitando alguno.';
const MENSAJE_ERROR = 'Ocurrió un problema al cargar el catálogo. Intenta de nuevo en unos segundos.';

async function cargarProductos({ reset = false } = {}) {
  const grid = document.querySelector('.catalog-grid');
  const btnCargarMas = document.getElementById('btn-cargar-mas');
  const mensajeVacio = document.getElementById('catalog-empty');

  if (reset) {
    paginaActual = 0;
    grid.innerHTML = renderLoader(PRODUCTOS_POR_PAGINA);
    mensajeVacio.hidden = true;
  }

  let query = construirConsulta();
  query = await aplicarBusqueda(query);

  const { data: products, error } = await query;

  // Sin importar la causa del error, el skeleton SIEMPRE se quita
  // aquí y se le avisa al usuario — nunca se queda pegado en
  // "cargando" para siempre.
  if (error) {
    console.error('Error cargando el catálogo desde Supabase:', error);
    grid.innerHTML = '';
    mensajeVacio.textContent = MENSAJE_ERROR;
    mensajeVacio.hidden = false;
    btnCargarMas.hidden = true;
    return;
  }

  if (reset) grid.innerHTML = '';

  if (reset && products.length === 0) {
    mensajeVacio.textContent = MENSAJE_SIN_RESULTADOS;
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
    ...filtros, // conserva 'busqueda' si venía de la URL o de una búsqueda previa
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
  await renderLayout();

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