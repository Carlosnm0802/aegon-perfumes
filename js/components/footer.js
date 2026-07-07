// ============================================================
// FOOTER
// ============================================================
// Componente reutilizable en las 7 páginas del sitio. Se
// inyecta con renderFooter() dentro de un contenedor <footer>
// ya presente en el HTML de cada página.
// ============================================================

export function renderFooter() {
  return `
    <div class="footer__logo">AEGON<span style="color:var(--color-accent)">PERFUMES</span></div>
    <p class="footer__tagline">Perfumes y decants — preparados con cuidado, entregados con confianza.</p>
    <a href="https://wa.me/521234567890?text=Hola%2C%20tengo%20una%20duda%20sobre%20sus%20perfumes" target="_blank" rel="noopener" class="btn btn-secondary footer__whatsapp">Escríbenos por WhatsApp</a>
    <div class="footer__meta">@aegonparfums &middot; Hecho a mano en México</div>
  `;
}