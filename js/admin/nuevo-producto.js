import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader } from './admin-header.js';

let contadorVariantes = 0;

// ============================================================
// FILAS DE VARIANTE (dinámicas)
// ============================================================
// Cada fila es independiente — el usuario puede agregar tantas
// como necesite (5ml, 10ml, 100ml...) y quitar las que no use.
// Siempre queda al menos 1 fila visible.
// ============================================================

function agregarFilaVariante() {
  const id = `variante-${contadorVariantes++}`;
  const contenedor = document.getElementById('variantes-container');

  const fila = document.createElement('div');
  fila.className = 'admin-variant-form-row';
  fila.dataset.filaId = id;
  fila.innerHTML = `
    <input type="text" placeholder="Tamaño (ej. 5ml)" class="variante-size-label" required>
    <select class="variante-type">
      <option value="decant">Decant</option>
      <option value="completo">Completo</option>
    </select>
    <input type="number" step="0.01" min="0" placeholder="Precio" class="variante-price" required>
    <label class="variante-available">
      <input type="checkbox" checked> Disponible
    </label>
    <button type="button" class="variante-quitar" aria-label="Quitar variante">✕</button>
  `;

  fila.querySelector('.variante-quitar').addEventListener('click', () => {
    // Nunca dejamos el formulario sin ninguna fila — no tendría
    // sentido crear un producto sin al menos una variante.
    if (contenedor.children.length > 1) {
      fila.remove();
    }
  });

  contenedor.appendChild(fila);
}

function leerVariantesDelFormulario() {
  const filas = document.querySelectorAll('.admin-variant-form-row');
  const variantes = [];

  filas.forEach(fila => {
    const size_label = fila.querySelector('.variante-size-label').value.trim();
    const price = Number(fila.querySelector('.variante-price').value);
    const available = fila.querySelector('.variante-available input').checked;

    if (size_label && price > 0) {
      variantes.push({ size_label, price, available });
    }
  });

  return variantes;
}

// ============================================================
// CARGAR CATEGORÍAS Y MARCAS PARA LOS SELECTS
// ============================================================
async function cargarOpciones() {
  const [{ data: categorias }, { data: marcas }] = await Promise.all([
    supabaseClient.from('categories').select('id, name').order('name'),
    supabaseClient.from('brands').select('id, name').order('name'),
  ]);

  const selectCategoria = document.getElementById('input-categoria');
  const selectMarca = document.getElementById('input-marca');

  selectCategoria.innerHTML = (categorias ?? [])
    .map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  selectMarca.innerHTML = (marcas ?? [])
    .map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function mostrarError(mensaje) {
  const el = document.getElementById('nuevo-producto-error');
  el.textContent = mensaje;
  el.hidden = false;
}

// ============================================================
// GUARDAR EL PRODUCTO
// ============================================================
// El id se genera en el navegador (mismo patrón que usamos en
// checkout.js) para poder nombrar el archivo de la foto ANTES
// de insertar el producto — sin esto, tendríamos un problema de
// huevo-y-gallina (no hay id hasta insertar, pero queremos subir
// la foto usando ese id en el nombre del archivo).
// ============================================================
async function crearProducto(datos, variantes, archivoFoto) {
  const productId = crypto.randomUUID();

  let imageUrl = 'https://placehold.co/600x600/1A1A1E/C5A059?text=Sin+foto';

  if (archivoFoto) {
    const extension = archivoFoto.name.split('.').pop();
    const nombreArchivo = `${productId}-${Date.now()}.${extension}`;

    const { error: errorSubida } = await supabaseClient.storage
      .from('product-images')
      .upload(nombreArchivo, archivoFoto);

    if (errorSubida) throw errorSubida;

    const { data: urlData } = supabaseClient.storage
      .from('product-images')
      .getPublicUrl(nombreArchivo);

    imageUrl = urlData.publicUrl;
  }

  const { error: errorProducto } = await supabaseClient
    .from('products')
    .insert({
      id: productId,
      name: datos.name,
      description: datos.description || null,
      image_url: imageUrl,
      gender: datos.gender,
      category_id: datos.category_id,
      brand_id: datos.brand_id,
      is_active: true,
    });

  if (errorProducto) throw errorProducto;

  const variantesAInsertar = variantes.map(v => ({ ...v, product_id: productId }));

  const { error: errorVariantes } = await supabaseClient
    .from('variants')
    .insert(variantesAInsertar);

  if (errorVariantes) throw errorVariantes;
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
async function iniciar() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('nuevo-producto');
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  await cargarOpciones();
  agregarFilaVariante(); // arranca con 1 fila vacía

  document.getElementById('btn-agregar-variante').addEventListener('click', agregarFilaVariante);

  const form = document.getElementById('nuevo-producto-form');
  const btnCrear = document.getElementById('btn-crear-producto');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('nuevo-producto-error').hidden = true;

    const variantes = leerVariantesDelFormulario();
    if (variantes.length === 0) {
      mostrarError('Agrega al menos una variante con tamaño y precio válidos.');
      return;
    }

    const datos = {
      name: document.getElementById('input-nombre').value.trim(),
      description: document.getElementById('input-descripcion').value.trim(),
      gender: document.getElementById('input-genero').value,
      category_id: document.getElementById('input-categoria').value,
      brand_id: document.getElementById('input-marca').value,
    };

    const archivoFoto = document.getElementById('input-foto').files[0] || null;

    btnCrear.disabled = true;
    btnCrear.textContent = 'Creando producto...';

    try {
      await crearProducto(datos, variantes, archivoFoto);
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error creando el producto:', error);
      mostrarError('No pudimos crear el producto. Intenta de nuevo.');
      btnCrear.disabled = false;
      btnCrear.textContent = 'Crear producto';
    }
  });
}

document.addEventListener('DOMContentLoaded', iniciar);