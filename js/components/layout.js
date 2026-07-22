import { renderNavbar, actualizarContadorCarrito } from './navbar.js';
import { renderFooter } from './footer.js';
import { renderWhatsappFloat } from './whatsapp-float.js';
import { renderCartPanel, activarCartPanel } from './cart-panel.js';
import { renderSearchBar, activarSearchBar } from './search-bar.js';
import { obtenerCarrito, contarItems } from '../cart.js';
import { obtenerWhatsappNumber } from '../settings.js';

// ============================================================
// LAYOUT COMPARTIDO
// ============================================================
// Inyecta navbar, footer, whatsapp-float, barra de búsqueda y
// el panel del carrito en cada página, y mantiene el contador
// del navbar sincronizado con el carrito real.
//
// [ALERTA] Ahora es asíncrona (obtiene el número de WhatsApp de
// Supabase antes de renderizar footer/whatsapp-float) — cada
// página que la llama necesita usar `await renderLayout()`.
// ============================================================

export async function renderLayout() {
  const numeroWhatsapp = await obtenerWhatsappNumber();

  document.getElementById('navbar-container').innerHTML = renderNavbar();
  document.getElementById('footer-container').innerHTML = renderFooter(numeroWhatsapp);
  document.getElementById('whatsapp-float-container').innerHTML = renderWhatsappFloat(numeroWhatsapp);
  document.getElementById('cart-panel-container').innerHTML = renderCartPanel();
  document.getElementById('search-bar-container').innerHTML = renderSearchBar();

  activarCartPanel();
  activarSearchBar();

  actualizarContadorCarrito(contarItems(obtenerCarrito()));

  window.addEventListener('carrito:actualizado', (e) => {
    actualizarContadorCarrito(contarItems(e.detail));
  });
}