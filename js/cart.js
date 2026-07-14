// ============================================================
// CARRITO — lógica de datos
// ============================================================
// Vive en localStorage bajo la clave 'aegon-cart', como una
// lista de items: { variantId, productId, name, brand, image,
// sizeLabel, type, price, quantity }.
//
// Cada función que modifica el carrito dispara un evento
// 'carrito:actualizado' en window, con el carrito completo como
// detalle. El navbar y el panel lateral escuchan ese evento para
// refrescarse — este archivo no conoce ni le importa quién
// está escuchando.
// ============================================================

const CART_KEY = 'aegon-cart';

export function obtenerCarrito() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
  window.dispatchEvent(new CustomEvent('carrito:actualizado', { detail: carrito }));
}

// Si la variante ya está en el carrito, suma 1 a su cantidad.
// Si no, la agrega como línea nueva.
export function agregarAlCarrito(item) {
  const carrito = obtenerCarrito();
  const existente = carrito.find(i => i.variantId === item.variantId);

  if (existente) {
    existente.quantity += 1;
  } else {
    carrito.push({ ...item, quantity: 1 });
  }

  guardarCarrito(carrito);
  return carrito;
}

// Si la cantidad llega a 0 o menos, la línea se elimina —
// consistente con lo que un usuario espera al presionar "−"
// hasta el final.
export function actualizarCantidad(variantId, cantidad) {
  let carrito = obtenerCarrito();

  if (cantidad <= 0) {
    carrito = carrito.filter(i => i.variantId !== variantId);
  } else {
    const item = carrito.find(i => i.variantId === variantId);
    if (item) item.quantity = cantidad;
  }

  guardarCarrito(carrito);
  return carrito;
}

export function eliminarDelCarrito(variantId) {
  const carrito = obtenerCarrito().filter(i => i.variantId !== variantId);
  guardarCarrito(carrito);
  return carrito;
}

export function calcularTotal(carrito) {
  return carrito.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function contarItems(carrito) {
  return carrito.reduce((total, item) => total + item.quantity, 0);
}

// Se llama una sola vez, justo después de guardar el pedido en
// Supabase con éxito — el carrito no debe seguir mostrando
// productos que ya se confirmaron como pedido.
export function vaciarCarrito() {
  guardarCarrito([]);
}