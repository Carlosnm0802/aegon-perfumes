import { formatearPrecio } from '../utils/format.js';
import { agregarAlCarrito } from '../cart.js';

// ============================================================
// TARJETA DE PRODUCTO
// ============================================================
// Construye el HTML de una tarjeta de producto y activa toda su
// interacción: selector de variante (tamaño/precio) y el botón
// "Agregar al carrito". Se usa en Home y Catálogo.
// ============================================================

export function renderProductCard(product) {
  const variantes = [...product.variants].sort((a, b) => a.price - b.price);
  const primera = variantes[0];
  const tipoProducto = primera?.type ?? 'completo';

  const pills = variantes.map((v, i) => `
    <button class="variant-pill"
            data-variant-id="${v.id}"
            data-price="${v.price}"
            data-type="${v.type ?? tipoProducto}"
            aria-pressed="${i === 0}"
            ${!v.available ? 'disabled' : ''}>
      ${v.size_label}
    </button>
  `).join('');

  const precioInicial = primera ? formatearPrecio(primera.price) : '—';

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card__image">
        <img src="${product.image_url}" alt="${product.name}" loading="lazy" width="440" height="440">
      </div>
      <div class="product-card__body">
        <div class="product-card__brand">${product.brand?.name ?? ''}</div>
        <div class="product-card__name">${product.name}</div>
        <div class="product-card__badges">${renderBadge(tipoProducto)}</div>
        <div class="variant-selector">${pills}</div>
        <div class="product-card__price">${precioInicial}</div>
        <button class="btn btn-primary" style="width:100%;">Agregar al carrito</button>
      </div>
    </div>
  `;
}

function renderBadge(type) {
  const badgeClass = type === 'decant' ? 'badge-decant' : 'badge-original';
  const badgeLabel = type === 'decant' ? 'Decant' : 'Completo';
  return `<span class="badge ${badgeClass}">${badgeLabel}</span>`;
}

// Activa el selector de variante Y el botón de agregar al
// carrito de una tarjeta ya insertada en el DOM.
export function activarSelectorDeVariante(card) {
  const pills = card.querySelectorAll('.variant-pill');
  const precioEl = card.querySelector('.product-card__price');
  const badgesEl = card.querySelector('.product-card__badges');
  const btnAgregar = card.querySelector('.product-card__body > .btn');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.disabled) return;
      pills.forEach(p => p.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');
      precioEl.textContent = formatearPrecio(pill.dataset.price);
      badgesEl.innerHTML = renderBadge(pill.dataset.type);
    });
  });

  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      const pillActivo = card.querySelector('.variant-pill[aria-pressed="true"]');
      if (!pillActivo || pillActivo.disabled) return;

      const item = {
        variantId: pillActivo.dataset.variantId,
        productId: card.dataset.productId,
        name: card.querySelector('.product-card__name').textContent,
        brand: card.querySelector('.product-card__brand').textContent,
        image: card.querySelector('.product-card__image img').src,
        sizeLabel: pillActivo.textContent.trim(),
        type: pillActivo.dataset.type,
        price: Number(pillActivo.dataset.price),
      };

      agregarAlCarrito(item);

      // Feedback breve — confirma la acción sin necesidad de abrir
      // el panel lateral automáticamente (eso sería intrusivo si
      // el usuario está comprando varios productos seguidos).
      const textoOriginal = btnAgregar.textContent;
      btnAgregar.textContent = '¡Agregado! ✓';
      btnAgregar.disabled = true;
      setTimeout(() => {
        btnAgregar.textContent = textoOriginal;
        btnAgregar.disabled = false;
      }, 1200);
    });
  }
}