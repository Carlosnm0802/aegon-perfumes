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
    <nav class="admin-nav">
      ${link('dashboard.html', 'Dashboard', 'dashboard')}
      ${link('index.html', 'Productos', 'productos')}
      ${link('nuevo-producto.html', 'Nuevo producto', 'nuevo-producto')}
      ${link('pedidos.html', 'Pedidos', 'pedidos')}
      ${link('categorias-marcas.html', 'Categorías y marcas', 'categorias-marcas')}
    </nav>
    <button class="btn btn-secondary" id="btn-cerrar-sesion">Cerrar sesión</button>
  `;
}