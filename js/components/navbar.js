// ============================================================
// NAVBAR
// ============================================================
// Componente reutilizable en las 7 páginas del sitio. Se
// inyecta con renderNavbar() dentro de un contenedor <header>
// ya presente en el HTML de cada página.
//
// El contador del carrito arranca en 0 — el Bloque 6 (Carrito)
// va a llamar a actualizarContadorCarrito(n) cada vez que el
// carrito cambie, sin necesidad de tocar este archivo de nuevo.
// ============================================================

export function renderNavbar() {
  return `
    <a href="index.html" class="navbar__logo">AEGON<span>PERFUMES</span></a>
    <div class="navbar__actions">
      <button class="navbar__icon-btn" aria-label="Buscar">⌕</button>
      <button class="navbar__icon-btn" id="navbar-cart-button" aria-label="Ver carrito">
        <svg class="navbar__icon-svg" viewBox="0 0 24 24" width="22" height="22">
          <path d="M6 7h12l-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7z"/>
          <path d="M9 7V5a3 3 0 016 0v2"/>
        </svg>
        <span class="navbar__cart-count" id="navbar-cart-count">0</span>
      </button>
    </div>
  `;
}

// El Bloque 6 importa y llama esta función cada vez que se
// agrega/quita un producto del carrito.
export function actualizarContadorCarrito(cantidad) {
  const contador = document.getElementById('navbar-cart-count');
  if (!contador) return;
  contador.textContent = cantidad;
}