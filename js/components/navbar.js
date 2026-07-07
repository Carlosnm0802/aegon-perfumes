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
      <button class="navbar__icon-btn" aria-label="Ver carrito">
        ⛁
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