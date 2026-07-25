// ============================================================
// FORMATEO DE PRECIOS
// ============================================================
// Convierte un número (o string numérico) al formato de precio
// que se muestra en toda la tienda: "$450 MXN".
// Centralizado aquí porque Catálogo, Home y Carrito lo van
// a necesitar por igual — evita copiar esta línea en 3 lugares.
// ============================================================

export function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-MX')} MXN`;
}
export function calcularPrecioConDescuento(precio, descuento, tipo = 'completo') {
  const base = Number(precio) || 0;
  const descuentoPct = Number(descuento ?? 0) || 0;

  if (tipo !== 'completo' || descuentoPct <= 0) {
    return base;
  }

  const precioFinal = base * (1 - descuentoPct / 100);
  return Math.max(0, precioFinal);
}

export function formatearDescuento(descuento) {
  const valor = Number(descuento ?? 0) || 0;
  if (!valor) return '';
  return `${valor.toFixed(0)}% OFF`;
}