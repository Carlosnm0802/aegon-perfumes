import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderLoader } from '../components/loader.js';
import { renderLayout } from '../components/layout.js';

// ============================================================
// PÁGINA: HOME
// ============================================================
// Orquesta el layout compartido (navbar, footer, whatsapp-float)
// y la carga de "Más vendidos".
// ============================================================

async function cargarMasVendidos() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  grid.innerHTML = renderLoader(4);

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

document.addEventListener('DOMContentLoaded', async () => {
  await renderLayout();
  cargarMasVendidos();
});