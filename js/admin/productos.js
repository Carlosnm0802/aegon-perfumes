import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';
import { renderProductoAdminCard, activarProductoAdminCard, activarSubidaDeImagen } from './product-editor.js';

async function cargarProductos() {
  const contenedor = document.getElementById('admin-productos-lista');
  if (!contenedor) return;

  contenedor.innerHTML = '<p>Cargando productos...</p>';

  try {
    const [
      { data: productos, error },
      { data: categorias, error: errorCategorias },
      { data: marcas, error: errorMarcas },
    ] = await Promise.all([
      supabaseClient
        .from('products')
        .select(`
          id, name, description, image_url, gender, category_id, brand_id, is_active,
          brand:brands(name),
          category:categories(name),
          variants(id, size_label, type, price, available)
        `)
        .order('created_at', { ascending: false }),
      supabaseClient.from('categories').select('id, name').order('name'),
      supabaseClient.from('brands').select('id, name').order('name'),
    ]);

    if (error || errorCategorias || errorMarcas) {
      console.error('Error cargando productos:', error);
      if (errorCategorias) console.error('Error cargando categorías:', errorCategorias);
      if (errorMarcas) console.error('Error cargando marcas:', errorMarcas);
      contenedor.innerHTML = '<p>No pudimos cargar los productos.</p>';
      return;
    }

    if (!productos || productos.length === 0) {
      contenedor.innerHTML = '<p>No hay productos registrados.</p>';
      return;
    }

    contenedor.innerHTML = productos.map(producto => renderProductoAdminCard(producto, {
      categorias,
      marcas,
    })).join('');
    contenedor.querySelectorAll('.admin-product-card').forEach(card => {
      activarProductoAdminCard(card);
      activarSubidaDeImagen(card);
    });
  } catch (error) {
    console.error('Error inesperado cargando productos:', error);
    contenedor.innerHTML = '<p>No pudimos cargar los productos.</p>';
  }
}

// Filtra las tarjetas ya renderizadas en el DOM — no hace ninguna
// consulta nueva a Supabase, por eso es instantáneo mientras se
// escribe. Funciona sobre lo que ya está cargado en pantalla.
function activarBusqueda() {
  const input = document.getElementById('admin-buscar-producto');
  if (!input) return;

  input.addEventListener('input', () => {
    const termino = input.value.trim().toLowerCase();
    document.querySelectorAll('.admin-product-card').forEach(card => {
      card.hidden = !card.dataset.search.includes(termino);
    });
  });
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return; // ya fue redirigido a login.html

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('productos');
  activarAdminHeader();
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  activarBusqueda();
  cargarProductos();
}

document.addEventListener('DOMContentLoaded', iniciar);