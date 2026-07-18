import { supabaseClient } from '../supabase-client.js';

// ============================================================
// GUARDIA DE AUTENTICACIÓN
// ============================================================
// Toda página del panel (excepto login.html) llama a
// requireAuth() al cargar. Si no hay sesión activa, redirige a
// login.html de inmediato — antes de mostrar cualquier dato.
//
// [ALERTA] Esta protección es de EXPERIENCIA DE USUARIO, no la
// seguridad real. La seguridad real vive en las políticas RLS de
// Supabase (Bloque 9B), que van a rechazar cualquier escritura
// sin una sesión válida, sin importar qué muestre o esconda el
// frontend. Alguien con conocimientos técnicos podría saltarse
// este redirect editando el HTML localmente, pero jamás podría
// escribir en la base de datos sin autenticarse de verdad — la
// base de datos es quien manda, no el navegador.
// ============================================================

export async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  // Si la sesión termina mientras el usuario sigue en la página
  // (por ejemplo, cerró sesión en otra pestaña), lo mandamos al
  // login en vez de dejarlo con una pantalla que ya no debería ver.
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'login.html';
    }
  });

  return session;
}

export async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}