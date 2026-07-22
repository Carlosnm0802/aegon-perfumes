// ============================================================
// HEADER DEL PANEL DE ADMINISTRACIÓN
// ============================================================
// Compartido entre todas las páginas del panel. Recibe qué
// sección está activa para resaltarla en la navegación.
//
// Los links a secciones que aún no existen (Pedidos, Categorías,
// Dashboard, etc.) se van a ir agregando aquí mismo conforme se
// construya cada bloque — por ahora solo existe "Productos".
// ============================================================

export function renderAdminHeader(seccionActiva) {
  const link = (href, label, id) => `
    <a href="${href}" class="admin-nav__link ${seccionActiva === id ? 'is-active' : ''}">${label}</a>
  `;

  return `
    <div class="admin-header__logo">AEGON<span>PERFUMES</span> · Admin</div>
    <button
      type="button"
      class="admin-header__menu-toggle"
      aria-label="Abrir menú de administración"
      aria-controls="admin-nav-panel"
      aria-expanded="false"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div class="admin-header__panel" id="admin-nav-panel">
      <nav class="admin-nav">
        ${link('dashboard.html', 'Dashboard', 'dashboard')}
        ${link('index.html', 'Productos', 'productos')}
        ${link('nuevo-producto.html', 'Nuevo producto', 'nuevo-producto')}
        ${link('pedidos.html', 'Pedidos', 'pedidos')}
        ${link('categorias-marcas.html', 'Categorías y marcas', 'categorias-marcas')}
        ${link('configuracion.html', 'Configuración', 'configuracion')}
      </nav>
      <button class="btn btn-secondary admin-header__logout" id="btn-cerrar-sesion">Cerrar sesión</button>
    </div>
  `;
}

export function activarAdminHeader() {
  const header = document.getElementById('admin-header-container');
  if (!header) return;

  const toggle = header.querySelector('.admin-header__menu-toggle');
  if (!toggle) return;
  const panel = header.querySelector('.admin-header__panel');
  if (!panel) return;

  const menuEstaAbierto = () => header.classList.contains('is-menu-open');

  const cerrarMenu = () => {
    header.classList.remove('is-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const abierto = header.classList.toggle('is-menu-open');
    toggle.setAttribute('aria-expanded', String(abierto));
  });

  header.querySelectorAll('.admin-nav__link').forEach(link => {
    link.addEventListener('click', cerrarMenu);
  });

  document.addEventListener('click', (evento) => {
    if (!menuEstaAbierto()) return;
    if (header.contains(evento.target)) return;
    cerrarMenu();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menuEstaAbierto()) {
      cerrarMenu();
      toggle.focus();
    }
  });

  panel.addEventListener('click', (evento) => {
    if (evento.target.id === 'btn-cerrar-sesion') {
      cerrarMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      cerrarMenu();
    }
  });
}