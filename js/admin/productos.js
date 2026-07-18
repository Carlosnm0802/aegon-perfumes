import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader } from './admin-header.js';
import { renderProductoAdminCard, activarProductoAdminCard, activarSubidaDeImagen } from './product-editor.js';

async function cargarProductos() {
  const contenedor = document.getElementById('admin-productos-lista');

  // A diferencia del catálogo público, aquí SÍ traemos productos
  // inactivos — la política de RLS para administradores
  // autenticados lo permite (Bloque 9B).
  const { data: productos, error } = await supabaseClient
    .from('products')
    .select(`
      id, name, image_url, is_active,
      brand:brands(name),
      category:categories(name),
      variants(id, size_label, price, available, type)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando productos:', error);
    contenedor.innerHTML = '<p>No pudimos cargar los productos.</p>';
    return;
  }

  contenedor.innerHTML = productos.map(renderProductoAdminCard).join('');
  contenedor.querySelectorAll('.admin-product-card').forEach(card => {
    activarProductoAdminCard(card);
    activarSubidaDeImagen(card);
  });
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return; // ya fue redirigido a login.html

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('productos');
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  cargarProductos();
}

document.addEventListener('DOMContentLoaded', iniciar);