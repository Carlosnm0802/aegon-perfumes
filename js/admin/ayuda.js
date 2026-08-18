import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';
import { WHATSAPP_NUMBER } from '../config.js';

// ============================================================
// PÁGINA DE AYUDA (ADMIN)
// ============================================================
// El contenido de esta página es estático (vive directo en
// ayuda.html) — no necesita traer nada de Supabase. Este
// archivo solo se encarga de lo que TODA página del admin
// necesita: exigir sesión iniciada y pintar el menú de arriba.
// ============================================================

async function iniciar() {
  const session = await requireAuth();
  if (!session) return; // ya fue redirigido a login.html

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('ayuda');
  activarAdminHeader();
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  const whatsappLink = document.getElementById('ayuda-whatsapp-link');
  if (whatsappLink) {
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}`;
    whatsappLink.target = '_blank';
    whatsappLink.rel = 'noopener';
  }
}

document.addEventListener('DOMContentLoaded', iniciar);