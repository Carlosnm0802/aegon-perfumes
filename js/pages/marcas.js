import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderLoader } from '../components/loader.js';
import { renderLayout } from '../components/layout.js';

let marcas = [];
let marcaSeleccionada = null;

function filtrarMarcas(termino) {
  const limpio = termino.trim().toLowerCase();
  if (!limpio) return marcas;
  return marcas.filter((marca) => marca.name.toLowerCase().includes(limpio));
}

function renderizarListaMarcas(lista) {
  const contenedor = document.getElementById('marcas-lista');
  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.innerHTML = '<li>No encontramos marcas con ese texto.</li>';
    return;
  }

  contenedor.innerHTML = lista.map((marca) => `
    <li>
      <button
        type="button"
        class="marcas-lista__btn ${marcaSeleccionada === marca.slug ? 'is-active' : ''}"
        data-brand-slug="${marca.slug}"
      >
        ${marca.name}
      </button>
    </li>
  `).join('');

  contenedor.querySelectorAll('[data-brand-slug]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.brandSlug;
      seleccionarMarca(slug);
    });
  });
}

async function cargarMarcas() {
  const { data, error } = await supabaseClient
    .from('brands')
    .select('name, slug')
    .order('name');

  if (error) {
    document.getElementById('marcas-lista').innerHTML = '<li>Error al cargar marcas.</li>';
    return;
  }

  marcas = data ?? [];
  renderizarListaMarcas(marcas);
}

async function cargarProductosPorMarca(slug) {
  const grid = document.getElementById('marcas-productos');
  const empty = document.getElementById('marcas-empty');
  const titulo = document.getElementById('marcas-seleccion-titulo');

  if (!grid || !empty || !titulo) return;

  const marca = marcas.find((item) => item.slug === slug);
  titulo.textContent = marca ? `Productos de ${marca.name}` : 'Productos por marca';
  empty.hidden = true;
  grid.innerHTML = renderLoader(6);

  const { data: products, error } = await supabaseClient
    .from('products')
    .select(`
      id, name, image_url,
      brand:brands!inner(name, slug),
      variants(id, size_label, price, discount_percentage, available, type)
    `)
    .eq('brand.slug', slug)
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = '';
    empty.hidden = false;
    empty.textContent = 'No pudimos cargar los productos de esta marca.';
    return;
  }

  if (!products || products.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    empty.textContent = 'Esta marca no tiene productos disponibles por ahora.';
    return;
  }

  grid.innerHTML = products.map(renderProductCard).join('');
  grid.querySelectorAll('.product-card').forEach(activarSelectorDeVariante);
}

function seleccionarMarca(slug) {
  marcaSeleccionada = slug;
  const params = new URLSearchParams(window.location.search);
  params.set('marca', slug);
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

  const linkCatalogo = document.getElementById('marcas-link-catalogo');
  if (linkCatalogo) {
    linkCatalogo.href = `catalogo.html?marca=${encodeURIComponent(slug)}`;
  }

  renderizarListaMarcas(filtrarMarcas(document.getElementById('marcas-buscar').value));
  cargarProductosPorMarca(slug);
}

function activarBuscador() {
  const input = document.getElementById('marcas-buscar');
  if (!input) return;

  input.addEventListener('input', () => {
    renderizarListaMarcas(filtrarMarcas(input.value));
  });
}

function obtenerMarcaDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('marca');
}

async function iniciar() {
  await renderLayout();
  await cargarMarcas();
  activarBuscador();

  const marcaDesdeUrl = obtenerMarcaDesdeUrl();
  if (marcaDesdeUrl && marcas.some((m) => m.slug === marcaDesdeUrl)) {
    seleccionarMarca(marcaDesdeUrl);
    return;
  }

  if (marcas.length > 0) {
    seleccionarMarca(marcas[0].slug);
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
