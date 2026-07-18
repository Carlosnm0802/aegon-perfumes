import { requireAuth, cerrarSesion } from './auth-guard.js';

async function iniciar() {
  const session = await requireAuth();
  if (!session) return; // ya fue redirigido a login.html

  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
}

document.addEventListener('DOMContentLoaded', iniciar);