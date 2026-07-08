import { obtenerCarrito, actualizarCantidad, eliminarDelCarrito, calcularTotal } from '../cart.js';
import { formatearPrecio } from '../utils/format.js';

// ============================================================
// PANEL LATERAL DEL CARRITO
// ============================================================
// Usa las clases .cart-overlay/.cart-panel/.cart-item/
// .cart-total-row ya definidas desde Fase 3. Se re-renderiza
// completo cada vez que el carrito cambia — más simple que
// actualizar nodos uno por uno, y el carrito nunca va a tener
// tantos productos como para que el costo de rehacer el HTML
// sea perceptible para el usuario.
// ============================================================

export function renderCartPanel() {
  return `
    <div class="cart-overlay" id="cart-overlay"></div>
    <aside class="cart-panel" id="cart-panel">
      <div class="cart-panel__header">
        <h3>Tu carrito</h3>
        <button class="cart-panel__close" id="cart-close" aria-label="Cerrar carrito">✕</button>
      </div>
      <div class="cart-panel__body" id="cart-items"></div>
      <div class="cart-panel__footer" id="cart-footer"></div>
    </aside>
  `;
}

function renderItemsYFooter() {
  const carrito = obtenerCarrito();
  const contenedorItems = document.getElementById('cart-items');
  const contenedorFooter = document.getElementById('cart-footer');
  if (!contenedorItems || !contenedorFooter) return;

  if (carrito.length === 0) {
    contenedorItems.innerHTML = `<p class="cart-empty">Tu carrito está vacío.</p>`;
    contenedorFooter.innerHTML = '';
    return;
  }

  contenedorItems.innerHTML = carrito.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" width="64" height="64">
      <div class="cart-item__info">
        <div class="cart-item__brand">${item.brand}</div>
        <div class="cart-item__name">${item.name} — ${item.sizeLabel}</div>
        <div class="cart-item__price">${formatearPrecio(item.price)}</div>
        <div class="cart-item__quantity">
          <button class="qty-btn" data-action="restar" data-variant-id="${item.variantId}">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="sumar" data-variant-id="${item.variantId}">+</button>
          <button class="cart-item__remove" data-action="eliminar" data-variant-id="${item.variantId}" aria-label="Eliminar">🗑</button>
        </div>
      </div>
    </div>
  `).join('');

  contenedorFooter.innerHTML = `
    <div class="cart-total-row">
      <span>Total</span>
      <span>${formatearPrecio(calcularTotal(carrito))}</span>
    </div>
    <a href="checkout.html" class="btn btn-primary" style="width:100%; margin-top: var(--space-4);">Ir a pagar</a>
  `;
}

export function activarCartPanel() {
  const overlay = document.getElementById('cart-overlay');
  const panel = document.getElementById('cart-panel');
  const btnAbrir = document.getElementById('navbar-cart-button');
  const btnCerrar = document.getElementById('cart-close');

  function abrir() {
    renderItemsYFooter();
    overlay.classList.add('is-visible');
    panel.classList.add('is-visible');
  }
  function cerrar() {
    overlay.classList.remove('is-visible');
    panel.classList.remove('is-visible');
  }

  btnAbrir.addEventListener('click', abrir);
  btnCerrar.addEventListener('click', cerrar);
  overlay.addEventListener('click', cerrar);

  // Delegación de eventos: un solo listener en el contenedor
  // maneja +/- y eliminar para cualquier producto, incluso los
  // que se agreguen al carrito después de que esto se ejecutó.
  document.getElementById('cart-items').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-variant-id]');
    if (!boton) return;

    const variantId = boton.dataset.variantId;
    const carrito = obtenerCarrito();
    const item = carrito.find(i => i.variantId === variantId);
    if (!item) return;

    if (boton.dataset.action === 'sumar') {
      actualizarCantidad(variantId, item.quantity + 1);
    } else if (boton.dataset.action === 'restar') {
      actualizarCantidad(variantId, item.quantity - 1);
    } else if (boton.dataset.action === 'eliminar') {
      eliminarDelCarrito(variantId);
    }
  });

  // Si el panel está abierto cuando el carrito cambia (desde esta
  // misma acción o cualquier otra), refresca su contenido.
  window.addEventListener('carrito:actualizado', () => {
    if (panel.classList.contains('is-visible')) {
      renderItemsYFooter();
    }
  });

  renderItemsYFooter();
}