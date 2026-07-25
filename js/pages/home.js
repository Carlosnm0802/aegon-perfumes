import { supabaseClient } from '../supabase-client.js';
import { renderProductCard, activarSelectorDeVariante } from '../components/product-card.js';
import { renderLoader } from '../components/loader.js';
import { renderLayout } from '../components/layout.js';
import { obtenerInstagramGallery } from '../settings.js';

const TESTIMONIOS_DE_RESPALDO = [
  {
    customer_name: 'Mariana L.',
    rating: 5,
    opinion: 'Me encanto la asesoria para elegir aroma. El envio fue puntual y la fragancia venia super bien protegida.',
  },
  {
    customer_name: 'Luis R.',
    rating: 5,
    opinion: 'Compre un decant para probar y termine pidiendo el frasco completo. Excelente atencion por WhatsApp.',
  },
];

// ============================================================
// PÁGINA: HOME
// ============================================================
// Orquesta el layout compartido (navbar, footer, whatsapp-float)
// y la carga de "Más vendidos".
// ============================================================

function sanitizarTexto(valor) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function estrellas(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function renderizarTestimonios(testimonios) {
  const lista = document.getElementById('testimonios-lista');
  if (!lista) return;

  lista.innerHTML = testimonios.map((item) => `
    <article class="testimonio-card">
      <div class="testimonio-card__head">
        <div class="testimonio-card__nombre">${sanitizarTexto(item.customer_name)}</div>
        <div class="testimonio-card__rating" aria-label="${item.rating} de 5 estrellas">${estrellas(item.rating)}</div>
      </div>
      <p class="testimonio-card__texto">${sanitizarTexto(item.opinion)}</p>
    </article>
  `).join('');
}

async function cargarTestimoniosPublicos() {
  const { data, error } = await supabaseClient
    .from('testimonials')
    .select('customer_name, rating, opinion, created_at')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error cargando testimonios públicos:', error);
    return TESTIMONIOS_DE_RESPALDO;
  }

  if (!data || data.length === 0) {
    return TESTIMONIOS_DE_RESPALDO;
  }

  return data;
}

async function activarFormularioTestimonios() {
  const form = document.getElementById('testimonio-form');
  const status = document.getElementById('testimonio-status');
  if (!form || !status) return;

  let testimonios = await cargarTestimoniosPublicos();
  renderizarTestimonios(testimonios);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('testimonio-nombre').value.trim();
    const rating = Number(document.getElementById('testimonio-calificacion').value);
    const opinion = document.getElementById('testimonio-opinion').value.trim();

    if (!nombre || !opinion || Number.isNaN(rating)) {
      status.textContent = 'Completa los campos para enviar tu testimonio.';
      status.hidden = false;
      return;
    }

    status.textContent = 'Enviando testimonio...';
    status.hidden = false;

    const { data, error } = await supabaseClient
      .from('testimonials')
      .insert({ customer_name: nombre, rating, opinion })
      .select('customer_name, rating, opinion, created_at')
      .single();

    if (error) {
      console.error('Error guardando testimonio:', error);
      status.textContent = 'No pudimos enviar tu testimonio. Intenta de nuevo en unos segundos.';
      return;
    }

    const nuevo = data ?? { customer_name: nombre, rating, opinion };
    testimonios = [nuevo, ...testimonios].slice(0, 8);
    renderizarTestimonios(testimonios);
    form.reset();
    document.getElementById('testimonio-calificacion').value = '5';

    status.textContent = 'Gracias por compartir tu opinion.';
    status.hidden = false;
  });
}

async function aplicarInstagramConfigurado() {
  const { instagramUrl, imageUrls } = await obtenerInstagramGallery();

  const perfil = document.getElementById('instagram-profile-link');
  if (perfil) perfil.href = instagramUrl;

  for (let i = 1; i <= 6; i++) {
    const item = document.getElementById(`instagram-item-${i}`);
    const image = document.getElementById(`instagram-image-${i}`);

    if (item) item.href = instagramUrl;
    if (image && imageUrls[i - 1]) image.src = imageUrls[i - 1];
  }
}

async function cargarMasVendidos() {
  const grid = document.getElementById('mas-vendidos-grid');
  if (!grid) return;

  grid.innerHTML = renderLoader(4);

  const consultaBase = `
    id, name, image_url,
    brand:brands(name),
    variants(id, size_label, price, discount_percentage, available, type)
  `;

  const { data: destacados, error } = await supabaseClient
    .from('products')
    .select(consultaBase)
    .eq('is_bestseller', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error cargando productos desde Supabase:', error);
    grid.innerHTML = '';
    return;
  }

  let products = destacados ?? [];

  if (products.length === 0) {
    const { data: fallback, error: fallbackError } = await supabaseClient
      .from('products')
      .select(consultaBase)
      .order('created_at', { ascending: false })
      .limit(4);

    if (fallbackError) {
      console.error('Error cargando fallback de más vendidos:', fallbackError);
      grid.innerHTML = '';
      return;
    }

    products = fallback ?? [];
  }

  grid.innerHTML = products.map(renderProductCard).join('');
  grid.querySelectorAll('.product-card').forEach(activarSelectorDeVariante);
}

async function cargarRecienLlegados() {
  const grid = document.getElementById('recien-llegados-grid');
  if (!grid) return;

  grid.innerHTML = renderLoader(4);

  const consultaBase = `
    id, name, image_url,
    brand:brands(name),
    variants(id, size_label, price, discount_percentage, available, type)
  `;

  const { data: destacados, error } = await supabaseClient
    .from('products')
    .select(consultaBase)
    .eq('is_new_arrival', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error cargando recién llegados:', error);
    grid.innerHTML = '';
    return;
  }

  let productos = destacados ?? [];

  if (productos.length === 0) {
    const { data: recientes, error: errorRecientes } = await supabaseClient
      .from('products')
      .select(consultaBase)
      .order('created_at', { ascending: false })
      .limit(4);

    if (errorRecientes) {
      console.error('Error cargando fallback de recién llegados:', errorRecientes);
      grid.innerHTML = '';
      return;
    }

    productos = recientes ?? [];
  }

  grid.innerHTML = productos.map(renderProductCard).join('');
  grid.querySelectorAll('.product-card').forEach(activarSelectorDeVariante);
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderLayout();
  await aplicarInstagramConfigurado();
  await activarFormularioTestimonios();
  cargarRecienLlegados();
  cargarMasVendidos();
});