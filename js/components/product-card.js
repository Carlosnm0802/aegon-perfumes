import { formatearPrecio } from '../utils/format.js';

// ============================================================
// TARJETA DE PRODUCTO
// ============================================================
// Construye el HTML de una tarjeta de producto y activa la
// interacción del selector de variante (tamaño/precio).
//
// Es el componente más importante del sitio: no hay página de
// ficha de producto individual en el MVP, así que esta tarjeta
// ES la decisión de compra completa. Se usa en Home ("Más
// vendidos") y, en el Bloque 4, también en el Catálogo.
// ============================================================

export function renderProductCard(product) {
  // Ordenamos las variantes de menor a mayor precio (3ml antes que 100ml)
  const variantes = [...product.variants].sort((a, b) => a.price - b.price);
  const primera = variantes[0];

  const pills = variantes.map((v, i) => `
    <button class="variant-pill"
            data-price="${v.price}"
            data-type="${v.type}"
            aria-pressed="${i === 0}"
            ${!v.available ? 'disabled' : ''}>
      ${v.size_label}
    </button>
  `).join('');

  const precioInicial = primera ? formatearPrecio(primera.price) : '—';

  return `
    <div class="product-card">
      <div class="product-card__image">
        <img src="${product.image_url}" alt="${product.name}" loading="lazy" width="440" height="440">
      </div>
      <div class="product-card__body">
        <div class="product-card__brand">${product.brand?.name ?? ''}</div>
        <div class="product-card__name">${product.name}</div>
        <div class="product-card__badges">${renderBadge(primera?.type)}</div>
        <div class="variant-selector">${pills}</div>
        <div class="product-card__price">${precioInicial}</div>
        <button class="btn btn-primary" style="width:100%;">Agregar al carrito</button>
      </div>
    </div>
  `;
}

// El badge depende del tipo de la VARIANTE seleccionada, no del
// producto — un mismo perfume puede mostrarse como "Decant" o
// "Completo" según el tamaño que el cliente toque.
function renderBadge(type) {
  const badgeClass = type === 'decant' ? 'badge-decant' : 'badge-original';
  const badgeLabel = type === 'decant' ? 'Decant' : 'Completo';
  return `<span class="badge ${badgeClass}">${badgeLabel}</span>`;
}

// Al hacer click en una variante: la marca como seleccionada,
// actualiza el precio y el badge — sin recargar la página, tal
// como se describió en el wireframe de Fase 3.
export function activarSelectorDeVariante(card) {
  const pills = card.querySelectorAll('.variant-pill');
  const precioEl = card.querySelector('.product-card__price');
  const badgesEl = card.querySelector('.product-card__badges');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.disabled) return;
      pills.forEach(p => p.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');
      precioEl.textContent = formatearPrecio(pill.dataset.price);
      badgesEl.innerHTML = renderBadge(pill.dataset.type);
    });
  });
}