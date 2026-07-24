import { supabaseClient } from './supabase-client.js';

const NUMERO_POR_DEFECTO = '521234567890';
const TRANSFERENCIA_POR_DEFECTO = {
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  note: 'Usa tu numero de pedido como concepto y envia tu comprobante por WhatsApp.',
};

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

export async function obtenerDatosTransferencia() {
  const { data, error } = await supabaseClient
    .from('settings')
    .select('transfer_bank_name, transfer_account_holder, transfer_account_number, transfer_note')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error obteniendo datos de transferencia, usando respaldo:', error);
    return TRANSFERENCIA_POR_DEFECTO;
  }

  return {
    bankName: data.transfer_bank_name ?? '',
    accountHolder: data.transfer_account_holder ?? '',
    accountNumber: data.transfer_account_number ?? '',
    note: data.transfer_note || TRANSFERENCIA_POR_DEFECTO.note,
  };
}