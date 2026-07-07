import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderWhatsappFloat } from '../components/whatsapp-float.js';
import { renderLoader } from '../components/loader.js';

// ============================================================
// PÁGINA: HOME
// ============================================================
// Orquesta el layout compartido (navbar, footer, whatsapp-float)
// y la carga de "Más vendidos". Este patrón de inicialización
// (renderizar layout, luego contenido específico de la página)
// se repite igual en Catálogo, Carrito, etc. en próximos bloques.
// ============================================================

function renderLayout() {
  document.getElementById('navbar-container').innerHTML = renderNavbar();
  document.getElementById('footer-container').innerHTML = renderFooter();
  document.getElementById('whatsapp-float-container').innerHTML = renderWhatsappFloat();
}

async function cargarMasVendidos() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  // Mostramos el skeleton de inmediato — el usuario nunca ve un
  // espacio vacío, incluso si la conexión tarda unos segundos.
  grid.innerHTML = renderLoader(4);

  // Nota: "type" ya no vive en products — se pide desde variants,
  // porque un mismo producto puede tener variantes decant y
  // variantes completo al mismo tiempo.
  const { data: products, error } = await supabaseClient
    .from('products')
    .select(`
      id, name, image_url,
      brand:brands(name),
      variants(id, size_label, price, available, type)
    `)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error cargando productos desde Supabase:', error);
    return;
  }

  grid.innerHTML = products.map(renderProductCard).join('');
  grid.querySelectorAll('.product-card').forEach(activarSelectorDeVariante);
}

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  cargarMasVendidos();
});