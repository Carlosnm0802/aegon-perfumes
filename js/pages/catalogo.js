import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderLoader } from '../components/loader.js';
import { renderLayout } from '../components/layout.js';
import { renderFilterPanel, activarPanelFiltros } from '../components/filter-panel.js';
import { searchProducts } from '../modules/catalogSearch.js';

const PRODUCTOS_POR_PAGINA = 12;

let filtros = { categoria: '', tipo: '', precio: '', genero: '', marcas: [], busqueda: '' };
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
  const tipo = params.get('tipo');
  const precio = params.get('precio');
  const genero = params.get('genero');
  const marcas = params.getAll('marca');
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

  if (tipo) filtros.tipo = tipo;
  if (precio) filtros.precio = precio;
  if (genero) filtros.genero = genero;
  if (marcas.length > 0) filtros.marcas = marcas;

  if (tipo) {
    const pillTipo = document.querySelector(
      `.filter-pills[data-filter-group="tipo"] .filter-pill[data-value="${tipo}"]`
    );
    if (pillTipo) {
      document.querySelectorAll('.filter-pills[data-filter-group="tipo"] .filter-pill')
        .forEach(p => p.setAttribute('aria-pressed', 'false'));
      pillTipo.setAttribute('aria-pressed', 'true');
    }
  }

  if (precio) {
    const pillPrecio = document.querySelector(
      `.filter-pills[data-filter-group="precio"] .filter-pill[data-value="${precio}"]`
    );
    if (pillPrecio) {
      document.querySelectorAll('.filter-pills[data-filter-group="precio"] .filter-pill')
        .forEach(p => p.setAttribute('aria-pressed', 'false'));
      pillPrecio.setAttribute('aria-pressed', 'true');
    }
  }

  if (marcas.length > 0) {
    document.querySelectorAll('input[name="marca"]').forEach((cb) => {
      cb.checked = marcas.includes(cb.value);
    });
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
    sincronizarFiltrosEnURL();
    mostrarIndicadorBusqueda();
    cargarProductos({ reset: true });
  });
}

function sincronizarFiltrosEnURL() {
  const params = new URLSearchParams();

  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.precio) params.set('precio', filtros.precio);
  if (filtros.genero) params.set('genero', filtros.genero);
  if (filtros.busqueda) params.set('buscar', filtros.busqueda);
  filtros.marcas.forEach((slug) => params.append('marca', slug));

  const query = params.toString();
  const nuevaURL = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, '', nuevaURL);
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

  try {
    const [precioMin, precioMax] = filtros.precio
      ? filtros.precio.split('-').map(valor => valor ? Number(valor) : null)
      : [null, null];
    const filtrosBusqueda = {
      ...filtros,
      precioMin,
      precioMax,
    };
    const products = await searchProducts(supabaseClient, filtrosBusqueda, {
      incluirStock: false,
      pagina: paginaActual,
      porPagina: PRODUCTOS_POR_PAGINA,
    });

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
  } catch (error) {
    console.error('Error cargando el catálogo desde Supabase:', error);
    grid.innerHTML = '';
    mensajeVacio.textContent = MENSAJE_ERROR;
    mensajeVacio.hidden = false;
    btnCargarMas.hidden = true;
  }
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
    sincronizarFiltrosEnURL();
    cargarProductos({ reset: true });
    document.getElementById('filter-overlay').classList.remove('is-visible');
    document.getElementById('filter-panel').classList.remove('is-visible');
  });

  document.getElementById('filter-limpiar').addEventListener('click', () => {
    limpiarPanel();
    leerFiltrosDelPanel();
    sincronizarFiltrosEnURL();
  });

  document.getElementById('btn-cargar-mas').addEventListener('click', () => {
    cargarProductos({ reset: false });
  });

  cargarProductos({ reset: true });
}

document.addEventListener('DOMContentLoaded', iniciarCatalogo);