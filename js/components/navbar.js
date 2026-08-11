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

export function renderNavbar({ instagramUrl = '#', tiktokUrl = '#' } = {}) {
  return `
    <a href="index.html" class="navbar__logo">AEGON<span>PERFUMES</span></a>
    <div class="navbar__desktop-nav" aria-label="Navegación principal">
      <a href="index.html#inicio" class="navbar__desktop-link">Inicio</a>
      <a href="catalogo.html" class="navbar__desktop-link">Catálogo</a>
      <a href="marcas.html" class="navbar__desktop-link">Marcas</a>
      <a href="catalogo.html?genero=hombre" class="navbar__desktop-link">Caballero</a>
      <a href="catalogo.html?genero=mujer" class="navbar__desktop-link">Dama</a>
      <a href="index.html#categorias" class="navbar__desktop-link">Categorías</a>
      <a href="index.html#footer-container" class="navbar__desktop-link">Contáctanos</a>
      <a href="index.html#testimonios" class="navbar__desktop-link">Testimonios</a>
    </div>
    <div class="navbar__actions">
      <button class="navbar__icon-btn navbar__menu-btn" id="navbar-menu-button" aria-label="Abrir menú" aria-expanded="false" aria-controls="navbar-mobile-menu">
        <svg class="navbar__icon-svg" viewBox="0 0 24 24" width="22" height="22">
          <path d="M3 6h18"/>
          <path d="M3 12h18"/>
          <path d="M3 18h18"/>
        </svg>
      </button>
      <a href="admin/login.html" class="navbar__admin-link" aria-label="Ir al panel de administración">Admin</a>
      <button class="navbar__icon-btn" id="navbar-search-button" aria-label="Buscar">⌕</button>
      <button class="navbar__icon-btn" id="navbar-cart-button" aria-label="Ver carrito">
        <svg class="navbar__icon-svg" viewBox="0 0 24 24" width="22" height="22">
          <path d="M6 7h12l-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7z"/>
          <path d="M9 7V5a3 3 0 016 0v2"/>
        </svg>
        <span class="navbar__cart-count" id="navbar-cart-count">0</span>
      </button>
    </div>
    <div class="navbar-menu-overlay" id="navbar-menu-overlay"></div>
    <nav class="navbar-menu" id="navbar-mobile-menu" aria-label="Navegación principal">
      <a href="index.html#inicio" class="navbar-menu__link">Inicio</a>
      <a href="catalogo.html" class="navbar-menu__link">Catálogo</a>
      <a href="marcas.html" class="navbar-menu__link">Marcas</a>
      <a href="catalogo.html?genero=hombre" class="navbar-menu__link">Caballero</a>
      <a href="catalogo.html?genero=mujer" class="navbar-menu__link">Dama</a>
      <a href="index.html#categorias" class="navbar-menu__link">Categorías</a>
      <a href="index.html#footer-container" class="navbar-menu__link">Contáctanos</a>
      <a href="index.html#testimonios" class="navbar-menu__link">Testimonios</a>

      <div class="navbar-menu__socials">
        <a href="${instagramUrl}" class="navbar-menu__social-link" target="_blank" rel="noopener" aria-label="Abrir Instagram">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
            <circle cx="12" cy="12" r="4"></circle>
            <circle cx="17.5" cy="6.5" r="1"></circle>
          </svg>
          <span>Instagram</span>
        </a>
        <a href="${tiktokUrl}" class="navbar-menu__social-link" target="_blank" rel="noopener" aria-label="Abrir TikTok">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M14 3c.4 1.9 1.5 3 3.4 3.4v2.7c-1.2 0-2.3-.3-3.4-.9v6.2a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1V12a2.6 2.6 0 1 0 1.8 2.5V3H14z"></path>
          </svg>
          <span>TikTok</span>
        </a>
      </div>
    </nav>
  `;
}

// El Bloque 6 importa y llama esta función cada vez que se
// agrega/quita un producto del carrito.
export function actualizarContadorCarrito(cantidad) {
  const contador = document.getElementById('navbar-cart-count');
  if (!contador) return;
  contador.textContent = cantidad;
}

export function activarNavbarMenu() {
  const boton = document.getElementById('navbar-menu-button');
  const menu = document.getElementById('navbar-mobile-menu');
  const overlay = document.getElementById('navbar-menu-overlay');

  if (!boton || !menu || !overlay) return;

  // Evita recortes visuales cuando el header crea su propio contexto.
  if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
  if (menu.parentElement !== document.body) document.body.appendChild(menu);

  function abrir() {
    menu.classList.add('is-visible');
    overlay.classList.add('is-visible');
    document.body.classList.add('menu-open');
    boton.setAttribute('aria-expanded', 'true');
  }

  function cerrar() {
    menu.classList.remove('is-visible');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('menu-open');
    boton.setAttribute('aria-expanded', 'false');
  }

  boton.addEventListener('click', () => {
    if (menu.classList.contains('is-visible')) {
      cerrar();
      return;
    }
    abrir();
  });

  overlay.addEventListener('click', cerrar);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', cerrar));
}