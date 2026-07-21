import { supabaseClient } from '../supabase-client.js';

// ============================================================
// TARJETA DE PRODUCTO EDITABLE (ADMIN)
// ============================================================
// Cada tarjeta representa un producto con todas sus variantes.
// Un solo botón "Guardar cambios" por tarjeta actualiza el
// estado activo/inactivo del producto Y el precio/disponibilidad
// de todas sus variantes en una sola acción — el cliente no
// tiene que guardar cada campo por separado.
// ============================================================

function renderNuevaVariantRow() {
  return `
    <div class="admin-variant-row admin-variant-row--nueva" data-variant-id="">
      <input type="text" placeholder="Tamaño (ej. 15ml)" class="admin-variant-row__size" data-field="size_label">
      <select class="admin-variant-row__type" data-field="type">
        <option value="decant">Decant</option>
        <option value="completo">Completo</option>
      </select>
      <input type="number" step="0.01" min="0" placeholder="Precio" class="admin-variant-row__price" data-field="price">
      <label class="admin-variant-row__available">
        <input type="checkbox" data-field="available" checked>
        Disponible
      </label>
      <button type="button" class="admin-variant-row__quitar" aria-label="Quitar">✕</button>
    </div>
  `;
}

export function renderProductoAdminCard(producto) {
  const variantesHtml = producto.variants.map(v => `
    <div class="admin-variant-row" data-variant-id="${v.id}">
      <span class="admin-variant-row__label">${v.size_label} · ${v.type === 'decant' ? 'Decant' : 'Completo'}</span>
      <input type="number" step="0.01" min="0" class="admin-variant-row__price" value="${v.price}" data-field="price">
      <label class="admin-variant-row__available">
        <input type="checkbox" data-field="available" ${v.available ? 'checked' : ''}>
        Disponible
      </label>
    </div>
  `).join('');

  const textoBusqueda = `${producto.name} ${producto.brand?.name ?? ''} ${producto.category?.name ?? ''}`.toLowerCase();

  return `
    <div class="admin-product-card" data-product-id="${producto.id}" data-search="${textoBusqueda}">
      <div class="admin-product-card__header">
        <div class="admin-product-card__image-wrap">
          <img src="${producto.image_url}" alt="${producto.name}" width="56" height="56" class="admin-product-card__thumb">
          <label class="admin-product-card__upload-label">
            Cambiar foto
            <input type="file" accept="image/*" class="admin-product-card__file-input" hidden>
          </label>
        </div>
        <div class="admin-product-card__info">
          <div class="admin-product-card__brand">${producto.brand?.name ?? ''}</div>
          <div class="admin-product-card__name">${producto.name}</div>
          <div class="admin-product-card__category">${producto.category?.name ?? ''}</div>
        </div>
        <label class="admin-product-card__active">
          <input type="checkbox" class="admin-product-card__active-checkbox" ${producto.is_active ? 'checked' : ''}>
          Activo
        </label>
      </div>

      <div class="admin-product-card__variants">
        ${variantesHtml}
      </div>
      <button type="button" class="btn btn-secondary admin-product-card__agregar-variante">+ Agregar variante</button>

      <div class="admin-product-card__footer">
        <span class="admin-product-card__status" hidden></span>
        <button class="btn btn-primary admin-product-card__guardar">Guardar cambios</button>
      </div>
    </div>
  `;
}

export function activarProductoAdminCard(card) {
  const productId = card.dataset.productId;
  const btnGuardar = card.querySelector('.admin-product-card__guardar');
  const btnAgregarVariante = card.querySelector('.admin-product-card__agregar-variante');
  const contenedorVariantes = card.querySelector('.admin-product-card__variants');
  const statusEl = card.querySelector('.admin-product-card__status');
  const checkboxActivo = card.querySelector('.admin-product-card__active-checkbox');

  btnAgregarVariante.addEventListener('click', () => {
    contenedorVariantes.insertAdjacentHTML('beforeend', renderNuevaVariantRow());
    const nuevaFila = contenedorVariantes.lastElementChild;
    // Solo las filas nuevas (aún no guardadas) se pueden quitar
    // libremente del formulario — no existen en la base de datos
    // todavía, así que no hay ningún riesgo de romper un historial.
    nuevaFila.querySelector('.admin-variant-row__quitar').addEventListener('click', () => {
      nuevaFila.remove();
    });
  });

  btnGuardar.addEventListener('click', async () => {
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    statusEl.hidden = true;

    try {
      const { error: errorProducto } = await supabaseClient
        .from('products')
        .update({ is_active: checkboxActivo.checked })
        .eq('id', productId);

      if (errorProducto) throw errorProducto;

      // Variantes que ya existían — se actualizan (precio/disponible).
      const filasExistentes = card.querySelectorAll('.admin-variant-row:not(.admin-variant-row--nueva)');
      for (const fila of filasExistentes) {
        const variantId = fila.dataset.variantId;
        const price = Number(fila.querySelector('[data-field="price"]').value);
        const available = fila.querySelector('[data-field="available"]').checked;

        const { error: errorVariante } = await supabaseClient
          .from('variants')
          .update({ price, available })
          .eq('id', variantId);

        if (errorVariante) throw errorVariante;
      }

      // Variantes agregadas con "+ Agregar variante" en esta
      // sesión — se insertan todas juntas, solo las que tengan
      // tamaño y precio válidos (evita crear filas vacías).
      const filasNuevas = card.querySelectorAll('.admin-variant-row--nueva');
      const nuevasAInsertar = [];
      filasNuevas.forEach(fila => {
        const size_label = fila.querySelector('[data-field="size_label"]').value.trim();
        const price = Number(fila.querySelector('[data-field="price"]').value);
        const type = fila.querySelector('[data-field="type"]').value;
        const available = fila.querySelector('[data-field="available"]').checked;

        if (size_label && price > 0) {
          nuevasAInsertar.push({ product_id: productId, size_label, price, type, available });
        }
      });

      if (nuevasAInsertar.length > 0) {
        const { error: errorInsertar } = await supabaseClient
          .from('variants')
          .insert(nuevasAInsertar);

        if (errorInsertar) throw errorInsertar;
      }

      statusEl.textContent = '✓ Guardado';
      statusEl.hidden = false;

      // Recargamos la página para que las variantes recién creadas
      // pasen a ser "existentes" con su id real de la base de datos
      // — evita insertarlas por duplicado si se presiona Guardar
      // de nuevo sin recargar.
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      console.error('Error guardando producto:', error);
      statusEl.textContent = 'Error al guardar. Intenta de nuevo.';
      statusEl.hidden = false;
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar cambios';
    }
  });
}

// ============================================================
// SUBIDA DE IMAGEN
// ============================================================
// Independiente del botón "Guardar cambios" — al elegir un
// archivo, se sube de inmediato y se actualiza image_url. No
// tiene sentido hacer esperar al usuario a que guarde el resto
// del formulario para algo que ya seleccionó y quiere subir ya.
// ============================================================

export function activarSubidaDeImagen(card) {
  const productId = card.dataset.productId;
  const fileInput = card.querySelector('.admin-product-card__file-input');
  const thumb = card.querySelector('.admin-product-card__thumb');
  const uploadLabel = card.querySelector('.admin-product-card__upload-label');
  const textoOriginal = uploadLabel.firstChild.textContent;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadLabel.firstChild.textContent = 'Subiendo...';
    fileInput.disabled = true;

    try {
      // Conservamos la extensión real del archivo — Supabase
      // Storage sirve archivos sin extensión como
      // binary/octet-stream, lo que rompe la vista previa.
      const extension = file.name.split('.').pop();
      const nombreArchivo = `${productId}-${Date.now()}.${extension}`;

      const { error: errorSubida } = await supabaseClient.storage
        .from('product-images')
        .upload(nombreArchivo, file, { upsert: true });

      if (errorSubida) throw errorSubida;

      const { data: urlData } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(nombreArchivo);

      const { error: errorProducto } = await supabaseClient
        .from('products')
        .update({ image_url: urlData.publicUrl })
        .eq('id', productId);

      if (errorProducto) throw errorProducto;

      thumb.src = urlData.publicUrl;
      uploadLabel.firstChild.textContent = '✓ Actualizada';
      setTimeout(() => { uploadLabel.firstChild.textContent = textoOriginal; }, 1500);
    } catch (error) {
      console.error('Error subiendo la imagen:', error);
      uploadLabel.firstChild.textContent = 'Error al subir';
      setTimeout(() => { uploadLabel.firstChild.textContent = textoOriginal; }, 2000);
    } finally {
      fileInput.disabled = false;
      fileInput.value = ''; // permite volver a seleccionar el mismo archivo
    }
  });
}