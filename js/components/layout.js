import { renderNavbar } from './navbar.js';
import { renderFooter } from './footer.js';
import { renderWhatsappFloat } from './whatsapp-float.js';

// ============================================================
// LAYOUT COMPARTIDO
// ============================================================
// Inyecta navbar, footer y el botón flotante de WhatsApp dentro
// de los contenedores que cada página HTML ya declara con los
// ids: navbar-container, footer-container, whatsapp-float-container.
//
// Toda página nueva (Catálogo, Carrito, Checkout...) llama a
// renderLayout() una sola vez al iniciar, en vez de repetir esta
// lógica de inyección en cada archivo de página.
// ============================================================

export function renderLayout() {
  document.getElementById('navbar-container').innerHTML = renderNavbar();
  document.getElementById('footer-container').innerHTML = renderFooter();
  document.getElementById('whatsapp-float-container').innerHTML = renderWhatsappFloat();
}