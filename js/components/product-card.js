import { formatearPrecio, calcularPrecioConDescuento, formatearDescuento } from '../utils/format.js';
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
  const varianteDestacada = variantes.find(v => {
    const tipo = v.type ?? 'completo';
    return tipo === 'completo' && Number(v.discount_percentage ?? 0) > 0;
  }) ?? variantes[0];
  const tipoProducto = varianteDestacada?.type ?? 'completo';

  const pills = variantes.map((v, i) => {
    const tipo = v.type ?? tipoProducto;
    const descuento = Number(v.discount_percentage ?? 0);
    const precioFinal = calcularPrecioConDescuento(v.price, descuento, tipo);
    const tieneDescuento = tipo === 'completo' && descuento > 0;

    return `
      <button class="variant-pill"
              data-variant-id="${v.id}"
              data-price="${precioFinal}"
              data-original-price="${v.price}"
              data-discount-percentage="${descuento}"
              data-type="${tipo}"
              aria-pressed="${v.id === varianteDestacada?.id}"
              ${!v.available ? 'disabled' : ''}>
        ${v.size_label}
      </button>
    `;
  }).join('');

  const precioInicial = varianteDestacada ? calcularPrecioConDescuento(varianteDestacada.price, Number(varianteDestacada?.discount_percentage ?? 0), varianteDestacada.type ?? tipoProducto) : null;
  const descuentoInicial = Number(varianteDestacada?.discount_percentage ?? 0);
  const tieneDescuentoInicial = (varianteDestacada?.type ?? tipoProducto) === 'completo' && descuentoInicial > 0;
  const descuentoTextoInicial = tieneDescuentoInicial ? formatearDescuento(descuentoInicial) : '';
  const ahorroInicial = tieneDescuentoInicial ? Number(varianteDestacada.price) - Number(precioInicial) : 0;

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card__image">
        <img src="${product.image_url}" alt="${product.name}" loading="lazy" width="440" height="440">
        ${tieneDescuentoInicial ? `<div class="product-card__floating-badge">${descuentoTextoInicial}</div>` : ''}
      </div>
      <div class="product-card__body">
        <div class="product-card__brand">${product.brand?.name ?? ''}</div>
        <div class="product-card__name">${product.name}</div>
        <div class="product-card__badges">${renderBadge(tipoProducto)}</div>
        <div class="variant-selector">${pills}</div>
        <div class="product-card__price-block">
          <div class="product-card__price">${precioInicial !== null ? formatearPrecio(precioInicial) : '—'}</div>
          ${tieneDescuentoInicial ? `<div class="product-card__old-price">${formatearPrecio(varianteDestacada.price)}</div>` : ''}
          ${descuentoTextoInicial ? `<div class="product-card__discount">${descuentoTextoInicial}</div>` : ''}
          ${tieneDescuentoInicial ? `<div class="product-card__savings">Ahorras ${formatearPrecio(ahorroInicial)}</div>` : ''}
        </div>
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
  const oldPriceEl = card.querySelector('.product-card__old-price');
  const discountEl = card.querySelector('.product-card__discount');
  const savingsEl = card.querySelector('.product-card__savings');
  const badgesEl = card.querySelector('.product-card__badges');
  const floatingBadgeEl = card.querySelector('.product-card__floating-badge');
  const btnAgregar = card.querySelector('.product-card__body > .btn');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.disabled) return;
      pills.forEach(p => p.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');

      const precioFinal = Number(pill.dataset.price);
      const precioOriginal = Number(pill.dataset.originalPrice);
      const descuentoPct = Number(pill.dataset.discountPercentage ?? 0);
      const tieneDescuento = pill.dataset.type === 'completo' && descuentoPct > 0;
      const ahorro = tieneDescuento ? precioOriginal - precioFinal : 0;

      precioEl.textContent = formatearPrecio(precioFinal);
      if (oldPriceEl) {
        oldPriceEl.textContent = tieneDescuento ? formatearPrecio(precioOriginal) : '';
        oldPriceEl.hidden = !tieneDescuento;
      }
      if (discountEl) {
        discountEl.textContent = tieneDescuento ? formatearDescuento(descuentoPct) : '';
        discountEl.hidden = !tieneDescuento;
      }
      if (savingsEl) {
        savingsEl.textContent = tieneDescuento ? `Ahorras ${formatearPrecio(ahorro)}` : '';
        savingsEl.hidden = !tieneDescuento;
      }
      if (floatingBadgeEl) {
        floatingBadgeEl.textContent = tieneDescuento ? formatearDescuento(descuentoPct) : '';
        floatingBadgeEl.hidden = !tieneDescuento;
      }
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