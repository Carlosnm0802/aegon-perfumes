import { supabaseClient } from '../supabase-client.js';
import { searchProducts } from '../modules/catalogSearch.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';

const PRODUCTOS_POR_PAGINA = 12;
const ETIQUETAS_ENTREGA = {
  local: 'Recoger en persona',
  envio_local: 'Envío local',
  paqueteria: 'Paquetería nacional',
};

let pedidoEnConstruccion = [];

function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-MX')} MXN`;
}

function convertirRangoPrecio(valor) {
  if (!valor) return { precioMin: null, precioMax: null };
  const [min, max] = valor.split('-');
  return { precioMin: Number(min), precioMax: max ? Number(max) : null };
}

/**
 * Traduce errores técnicos del RPC a instrucciones claras para el dueño.
 * @param {Error|Object} error - error devuelto por Supabase
 * @returns {string} mensaje accionable para la interfaz
 */
function traducirErrorPedido(error) {
  const mensaje = error?.message ?? '';
  if (mensaje.includes('Stock insuficiente')) {
    return 'No hay suficiente inventario de uno de los productos. Ajusta la cantidad e inténtalo de nuevo.';
  }
  if (mensaje.includes('Variante') && mensaje.includes('no encontrada')) {
    return 'Uno de los productos seleccionados ya no está disponible. Bórralo y agrégalo nuevamente.';
  }
  if (mensaje.includes('cantidad positiva')) {
    return 'Cada producto debe tener una cantidad mayor que cero.';
  }
  return 'No pudimos registrar el pedido. Revisa los datos e inténtalo de nuevo.';
}

function leerFiltros() {
  const rango = convertirRangoPrecio(document.getElementById('nuevo-pedido-precio').value);
  return {
    busqueda: document.getElementById('nuevo-pedido-busqueda').value.trim(),
    categoria: document.getElementById('nuevo-pedido-categoria').value,
    marcas: document.getElementById('nuevo-pedido-marca').value
      ? [document.getElementById('nuevo-pedido-marca').value]
      : [],
    genero: '',
    tipo: document.getElementById('nuevo-pedido-tipo').value,
    ...rango,
  };
}

function renderResultados(productos) {
  const contenedor = document.getElementById('nuevo-pedido-resultados-lista');
  const totalResultados = document.getElementById('nuevo-pedido-resultados');
  totalResultados.textContent = `${productos.length} productos`;

  if (productos.length === 0) {
    contenedor.innerHTML = '<p class="admin-order-empty">No encontramos productos con esos filtros.</p>';
    return;
  }

  contenedor.innerHTML = productos.flatMap(producto => producto.variants.map(variant => `
    <article class="admin-order-result">
      <div>
        <span class="admin-order-result__brand">${producto.brand?.name ?? ''}</span>
        <strong>${producto.name}</strong>
        <span>${variant.type} · ${variant.size_label} · ${formatearPrecio(variant.price)}</span>
        <span class="admin-order-result__stock">Stock disponible: ${variant.stock}</span>
      </div>
      <button type="button" class="btn btn-secondary admin-order-result__add"
        data-variant-id="${variant.id}" data-product-id="${producto.id}"
        data-name="${producto.name}" data-brand="${producto.brand?.name ?? ''}"
        data-size="${variant.size_label}" data-type="${variant.type}"
        data-price="${variant.price}" data-stock="${variant.stock}">
        Agregar
      </button>
    </article>
  `)).join('');

  contenedor.querySelectorAll('.admin-order-result__add').forEach(button => {
    button.addEventListener('click', () => agregarItem(button.dataset));
  });
}

function agregarItem(datos) {
  const stock = Number(datos.stock);
  const existente = pedidoEnConstruccion.find(item => item.variantId === datos.variantId);
  if (existente) {
    existente.cantidad = Math.min(existente.cantidad + 1, stock);
  } else {
    pedidoEnConstruccion.push({
      variantId: datos.variantId,
      name: datos.name,
      brand: datos.brand,
      variantLabel: `${datos.type} ${datos.size}`,
      price: Number(datos.price),
      stock,
      cantidad: 1,
    });
  }
  renderPedidoEnConstruccion();
}

function renderPedidoEnConstruccion() {
  const contenedor = document.getElementById('nuevo-pedido-items');
  const total = pedidoEnConstruccion.reduce((sum, item) => sum + item.price * item.cantidad, 0);
  document.getElementById('nuevo-pedido-total').textContent = formatearPrecio(total);

  if (pedidoEnConstruccion.length === 0) {
    contenedor.innerHTML = '<p class="admin-order-empty">Aún no hay productos en el pedido.</p>';
    return;
  }

  contenedor.innerHTML = pedidoEnConstruccion.map(item => `
    <div class="admin-order-item" data-variant-id="${item.variantId}">
      <div>
        <strong>${item.name}</strong>
        <span>${item.variantLabel} · ${formatearPrecio(item.price)}</span>
        <small>Máximo disponible: ${item.stock}</small>
      </div>
      <input class="admin-order-item__quantity" type="number" min="1" max="${item.stock}"
        value="${item.cantidad}" data-variant-id="${item.variantId}" aria-label="Cantidad de ${item.name}">
      <button type="button" class="admin-order-item__remove" data-variant-id="${item.variantId}" aria-label="Quitar ${item.name}">Quitar</button>
    </div>
  `).join('');

  contenedor.querySelectorAll('.admin-order-item__quantity').forEach(input => {
    input.addEventListener('change', () => {
      const item = pedidoEnConstruccion.find(linea => linea.variantId === input.dataset.variantId);
      if (item) item.cantidad = Math.max(1, Math.min(item.stock, Number(input.value) || 1));
      renderPedidoEnConstruccion();
    });
  });
  contenedor.querySelectorAll('.admin-order-item__remove').forEach(button => {
    button.addEventListener('click', () => {
      pedidoEnConstruccion = pedidoEnConstruccion.filter(item => item.variantId !== button.dataset.variantId);
      renderPedidoEnConstruccion();
    });
  });
}

async function cargarResultados() {
  const contenedor = document.getElementById('nuevo-pedido-resultados-lista');
  contenedor.innerHTML = '<p>Cargando productos...</p>';
  try {
    const productos = await searchProducts(supabaseClient, leerFiltros(), {
      incluirStock: true,
      pagina: 0,
      porPagina: PRODUCTOS_POR_PAGINA,
    });
    renderResultados(productos);
  } catch (error) {
    console.error('Error buscando productos para el pedido:', error);
    contenedor.innerHTML = '<p>No pudimos cargar los productos.</p>';
  }
}

async function cargarOpcionesFiltro() {
  const [{ data: categorias }, { data: marcas }] = await Promise.all([
    supabaseClient.from('categories').select('name, slug').order('name'),
    supabaseClient.from('brands').select('name, slug').order('name'),
  ]);
  document.getElementById('nuevo-pedido-categoria').insertAdjacentHTML(
    'beforeend', (categorias ?? []).map(categoria => `<option value="${categoria.slug}">${categoria.name}</option>`).join('')
  );
  document.getElementById('nuevo-pedido-marca').insertAdjacentHTML(
    'beforeend', (marcas ?? []).map(marca => `<option value="${marca.slug}">${marca.name}</option>`).join('')
  );
}

async function confirmarPedido(evento) {
  evento.preventDefault();
  const errorEl = document.getElementById('nuevo-pedido-error');
  const exitoEl = document.getElementById('nuevo-pedido-exito');
  const boton = document.getElementById('nuevo-pedido-confirmar');
  errorEl.hidden = true;
  exitoEl.hidden = true;

  if (pedidoEnConstruccion.length === 0) {
    errorEl.textContent = 'Agrega al menos un producto al pedido.';
    errorEl.hidden = false;
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Confirmando...';
  try {
    const customerName = document.getElementById('nuevo-pedido-nombre').value.trim();
    const customerPhone = document.getElementById('nuevo-pedido-telefono').value.trim();
    const deliveryType = document.getElementById('nuevo-pedido-entrega').value;
    const { data: orderId, error } = await supabaseClient.rpc('create_order_and_deduct_stock', {
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_delivery_type: deliveryType,
      p_items: pedidoEnConstruccion.map(item => ({
        variant_id: item.variantId,
        quantity: item.cantidad,
      })),
    });
    if (error) throw error;

    exitoEl.textContent = `Pedido ${orderId} creado correctamente.`;
    exitoEl.hidden = false;
    pedidoEnConstruccion = [];
    document.getElementById('nuevo-pedido-form').reset();
    renderPedidoEnConstruccion();
    await cargarResultados();
  } catch (error) {
    console.error('Error creando pedido:', error);
    errorEl.textContent = traducirErrorPedido(error);
    errorEl.hidden = false;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Confirmar pedido';
  }
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return;
  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('nuevo-pedido');
  activarAdminHeader();
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
  await cargarOpcionesFiltro();
  document.querySelectorAll('.admin-order-filters select').forEach(select => select.addEventListener('change', cargarResultados));
  document.getElementById('nuevo-pedido-busqueda').addEventListener('input', cargarResultados);
  document.getElementById('nuevo-pedido-form').addEventListener('submit', confirmarPedido);
  renderPedidoEnConstruccion();
}

document.addEventListener('DOMContentLoaded', iniciar);