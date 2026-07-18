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
        <img src="${producto.image_url}" alt="${producto.name}" width="56" height="56">
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