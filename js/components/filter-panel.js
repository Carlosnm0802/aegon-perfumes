// ============================================================
// PANEL DE FILTROS (bottom sheet)
// ============================================================
// Genera el HTML del modal de filtros y maneja su apertura,
// cierre, y el comportamiento de selección única dentro de cada
// grupo tipo "pill" (Categoría, Tipo, Precio).
//
// NO decide qué pasa con los datos al presionar "Aplicar" — esa
// lógica vive en catalogo.js, porque ahí es donde se sabe cómo
// consultar Supabase con los filtros elegidos.
// ============================================================

export function renderFilterPanel(categorias, marcas) {
  const categoriaOptions = categorias.map(c => `
    <button class="filter-pill" data-filter-group="categoria" data-value="${c.slug}" aria-pressed="false">${c.name}</button>
  `).join('');

  const marcaOptions = marcas.map(m => `
    <label class="filter-checkbox">
      <input type="checkbox" name="marca" value="${m.slug}">
      <span>${m.name}</span>
    </label>
  `).join('');

  return `
    <div class="filter-overlay" id="filter-overlay"></div>
    <div class="filter-panel" id="filter-panel">
      <div class="filter-panel__header">
        <h3>Filtrar</h3>
        <button class="filter-panel__close" id="filter-close" aria-label="Cerrar filtros">✕</button>
      </div>

      <div class="filter-panel__body">
        <div class="filter-group">
          <div class="filter-group__title">Categoría</div>
          <div class="filter-pills" data-filter-group="categoria">
            <button class="filter-pill" data-filter-group="categoria" data-value="" aria-pressed="true">Todas</button>
            ${categoriaOptions}
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group__title">Tipo</div>
          <div class="filter-pills" data-filter-group="tipo">
            <button class="filter-pill" data-filter-group="tipo" data-value="" aria-pressed="true">Todos</button>
            <button class="filter-pill" data-filter-group="tipo" data-value="decant" aria-pressed="false">Decant</button>
            <button class="filter-pill" data-filter-group="tipo" data-value="completo" aria-pressed="false">Completo</button>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group__title">Precio</div>
          <div class="filter-pills" data-filter-group="precio">
            <button class="filter-pill" data-filter-group="precio" data-value="" aria-pressed="true">Todos</button>
            <button class="filter-pill" data-filter-group="precio" data-value="0-500" aria-pressed="false">Menos de $500</button>
            <button class="filter-pill" data-filter-group="precio" data-value="500-1000" aria-pressed="false">$500–$1,000</button>
            <button class="filter-pill" data-filter-group="precio" data-value="1000-2000" aria-pressed="false">$1,000–$2,000</button>
            <button class="filter-pill" data-filter-group="precio" data-value="2000-" aria-pressed="false">Más de $2,000</button>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group__title">Marca</div>
          <div class="filter-checkbox-list">
            ${marcaOptions}
          </div>
        </div>
      </div>

      <div class="filter-panel__footer">
        <button class="btn btn-secondary" id="filter-limpiar">Limpiar</button>
        <button class="btn btn-primary" id="filter-aplicar">Aplicar filtros</button>
      </div>
    </div>
  `;
}

// Abre/cierra el panel y activa la selección única por grupo de
// pills (tocar uno desactiva a los demás del mismo grupo). El
// grupo de Marca usa checkboxes normales, que no necesitan esto.
export function activarPanelFiltros() {
  const overlay = document.getElementById('filter-overlay');
  const panel = document.getElementById('filter-panel');
  const btnAbrir = document.getElementById('btn-abrir-filtros');
  const btnCerrar = document.getElementById('filter-close');

  function abrir() {
    overlay.classList.add('is-visible');
    panel.classList.add('is-visible');
  }
  function cerrar() {
    overlay.classList.remove('is-visible');
    panel.classList.remove('is-visible');
  }

  btnAbrir.addEventListener('click', abrir);
  btnCerrar.addEventListener('click', cerrar);
  overlay.addEventListener('click', cerrar);

  document.querySelectorAll('.filter-pills').forEach(grupo => {
    grupo.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        grupo.querySelectorAll('.filter-pill').forEach(p => p.setAttribute('aria-pressed', 'false'));
        pill.setAttribute('aria-pressed', 'true');
      });
    });
  });

  return { abrir, cerrar };
}