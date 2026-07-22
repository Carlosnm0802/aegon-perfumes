import { supabaseClient } from './supabase-client.js';

const NUMERO_POR_DEFECTO = '521234567890';

// ============================================================
// CONFIGURACIÓN GLOBAL (settings)
// ============================================================
// Hoy solo guarda el número de WhatsApp, editable desde el panel
// de administración (Bloque 9J). Si por algún motivo no se puede
// leer, usamos un número de respaldo — el sitio nunca debe
// quedarse sin botón de WhatsApp funcional, ni siquiera si
// Supabase tuviera un problema momentáneo.
// ============================================================
export async function obtenerWhatsappNumber() {
  const { data, error } = await supabaseClient
    .from('settings')
    .select('whatsapp_number')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error obteniendo el número de WhatsApp, usando el de respaldo:', error);
    return NUMERO_POR_DEFECTO;
  }

  return data.whatsapp_number;
}