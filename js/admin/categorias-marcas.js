import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader } from './admin-header.js';

// Convierte "Xerjoff" en "xerjoff", "Yves Saint Laurent" en
// "yves-saint-laurent" — mismo formato que ya usan tus slugs
// existentes (arabe, disenador, ysl, giorgio-armani...).
function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function cargarCategorias() {
  const lista = document.getElementById('lista-categorias');
  const { data, error } = await supabaseClient.from('categories').select('name, slug').order('name');

  if (error) {
    lista.innerHTML = '<li>Error al cargar categorías.</li>';
    return;
  }
  lista.innerHTML = data.map(c => `<li>${c.name} <span class="admin-slug">(${c.slug})</span></li>`).join('');
}

async function cargarMarcas() {
  const lista = document.getElementById('lista-marcas');
  const { data, error } = await supabaseClient.from('brands').select('name, slug').order('name');

  if (error) {
    lista.innerHTML = '<li>Error al cargar marcas.</li>';
    return;
  }
  lista.innerHTML = data.map(m => `<li>${m.name} <span class="admin-slug">(${m.slug})</span></li>`).join('');
}

function activarFormularioCategoria() {
  const form = document.getElementById('form-nueva-categoria');
  const input = document.getElementById('input-nueva-categoria');
  const errorEl = document.getElementById('error-categoria');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const name = input.value.trim();
    if (!name) return;

    const { error } = await supabaseClient
      .from('categories')
      .insert({ name, slug: generarSlug(name) });

    if (error) {
      // 23505 = violación de restricción "unique" en Postgres —
      // el slug o nombre ya existía.
      errorEl.textContent = error.code === '23505'
        ? 'Ya existe una categoría con ese nombre.'
        : 'No pudimos crear la categoría.';
      errorEl.hidden = false;
      return;
    }

    input.value = '';
    cargarCategorias();
  });
}

function activarFormularioMarca() {
  const form = document.getElementById('form-nueva-marca');
  const input = document.getElementById('input-nueva-marca');
  const errorEl = document.getElementById('error-marca');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const name = input.value.trim();
    if (!name) return;

    const { error } = await supabaseClient
      .from('brands')
      .insert({ name, slug: generarSlug(name) });

    if (error) {
      errorEl.textContent = error.code === '23505'
        ? 'Ya existe una marca con ese nombre.'
        : 'No pudimos crear la marca.';
      errorEl.hidden = false;
      return;
    }

    input.value = '';
    cargarMarcas();
  });
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('categorias-marcas');
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  activarFormularioCategoria();
  activarFormularioMarca();
  cargarCategorias();
  cargarMarcas();
}

document.addEventListener('DOMContentLoaded', iniciar);