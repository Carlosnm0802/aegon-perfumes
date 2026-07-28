import { supabaseClient } from '../supabase-client.js';

// ============================================================
// LOGIN DEL PANEL
// ============================================================
// No hay registro público — el usuario administrador se crea
// manualmente desde el Dashboard de Supabase (Authentication →
// Users). Esta página solo intenta iniciar sesión con lo que
// ya existe.
// ============================================================

const form = document.getElementById('login-form');
const btnEntrar = document.getElementById('btn-entrar');
const errorEl = document.getElementById('login-error');
const passwordInput = document.getElementById('input-password');
const togglePasswordBtn = document.getElementById('toggle-password');
const iconEyeOpen = document.getElementById('icon-eye-open');
const iconEyeClosed = document.getElementById('icon-eye-closed');

// Si ya hay una sesión activa (el usuario volvió a esta página
// por error, o el navegador recordó su sesión), no tiene sentido
// mostrar el login de nuevo.
async function redirigirSiYaHaySesion() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'index.html';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const email = document.getElementById('input-email').value.trim();
  const password = passwordInput.value;

  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = 'Correo o contraseña incorrectos.';
    errorEl.hidden = false;
    btnEntrar.disabled = false;
    btnEntrar.textContent = 'Entrar';
    return;
  }

  window.location.href = 'index.html';
});

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', () => {
    const mostrando = passwordInput.type === 'text';
    passwordInput.type = mostrando ? 'password' : 'text';

    togglePasswordBtn.setAttribute('aria-pressed', String(!mostrando));
    togglePasswordBtn.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');

    if (iconEyeOpen && iconEyeClosed) {
      iconEyeOpen.hidden = !mostrando;
      iconEyeClosed.hidden = mostrando;
    }
  });
}

redirigirSiYaHaySesion();