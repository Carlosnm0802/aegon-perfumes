// ============================================================
// BARRA DE BÚSQUEDA (slide-down)
// ============================================================
// Se despliega debajo del navbar al tocar la lupa. Al enviar el
// formulario, navega a catalogo.html?buscar=termino — la lógica
// real de búsqueda (consulta a Supabase) vive en catalogo.js,
// no aquí. Este componente solo captura la intención del usuario
// y arma la URL.
// ============================================================

export function renderSearchBar() {
  return `
    <div class="search-bar" id="search-bar">
      <form class="search-bar__form" id="search-form">
        <svg class="search-bar__icon" viewBox="0 0 24 24" width="18" height="18">
          <circle cx="11" cy="11" r="7"/>
          <path d="M21 21l-4.3-4.3"/>
        </svg>
        <input
          type="search"
          id="search-input"
          class="search-bar__input"
          placeholder="Buscar perfume o marca..."
          autocomplete="off"
        >
        <button type="button" class="search-bar__close" id="search-close" aria-label="Cerrar búsqueda">✕</button>
      </form>
    </div>
  `;
}

export function activarSearchBar() {
  const barra = document.getElementById('search-bar');
  const btnAbrir = document.getElementById('navbar-search-button');
  const btnCerrar = document.getElementById('search-close');
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');

  function abrir() {
    barra.classList.add('is-visible');
    input.focus();
  }

  function cerrar() {
    barra.classList.remove('is-visible');
  }

  btnAbrir.addEventListener('click', () => {
    barra.classList.contains('is-visible') ? cerrar() : abrir();
  });

  btnCerrar.addEventListener('click', cerrar);

  // Cerrar con Escape — comportamiento esperado en cualquier
  // campo de búsqueda desplegable.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrar();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const termino = input.value.trim();
    if (!termino) return;
    window.location.href = `catalogo.html?buscar=${encodeURIComponent(termino)}`;
  });
}