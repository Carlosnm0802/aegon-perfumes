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

  return `
    <div class="admin-product-card" data-product-id="${producto.id}">
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
  const statusEl = card.querySelector('.admin-product-card__status');
  const checkboxActivo = card.querySelector('.admin-product-card__active-checkbox');

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

      // Actualiza cada variante por separado — RLS ya permite esto
      // porque la sesión está autenticada (política del Bloque 9B).
      const filasVariantes = card.querySelectorAll('.admin-variant-row');
      for (const fila of filasVariantes) {
        const variantId = fila.dataset.variantId;
        const price = Number(fila.querySelector('[data-field="price"]').value);
        const available = fila.querySelector('[data-field="available"]').checked;

        const { error: errorVariante } = await supabaseClient
          .from('variants')
          .update({ price, available })
          .eq('id', variantId);

        if (errorVariante) throw errorVariante;
      }

      statusEl.textContent = '✓ Guardado';
      statusEl.hidden = false;
    } catch (error) {
      console.error('Error guardando producto:', error);
      statusEl.textContent = 'Error al guardar. Intenta de nuevo.';
      statusEl.hidden = false;
    } finally {
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