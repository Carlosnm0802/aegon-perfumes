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