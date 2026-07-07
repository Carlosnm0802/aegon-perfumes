// ============================================================
// LOADER (skeleton)
// ============================================================
// Tarjetas "fantasma" que ocupan el espacio de las tarjetas de
// producto reales mientras Supabase responde. Evita que el
// usuario vea un grid vacío y evita el "salto" de layout cuando
// los productos reales se renderizan encima.
//
// Uso típico en una página:
//   grid.innerHTML = renderLoader(4);   // antes del fetch
//   ...
//   grid.innerHTML = products.map(renderProductCard).join(''); // después
// ============================================================

export function renderLoader(cantidad = 4) {
  const skeletonCard = `
    <div class="skeleton-card">
      <div class="skeleton-card__image"></div>
      <div class="skeleton-card__body">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--medium"></div>
        <div class="skeleton-line skeleton-line--long"></div>
      </div>
    </div>
  `;
  return skeletonCard.repeat(cantidad);
}