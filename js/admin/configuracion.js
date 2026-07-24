import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';

// Guardamos el id real de la fila (tu tabla usa uuid, no un id
// fijo) para poder actualizarla — lo leemos una vez al cargar.
let settingsId = null;

async function cargarConfiguracion() {
  const { data, error } = await supabaseClient
    .from('settings')
    .select('id, whatsapp_number, transfer_bank_name, transfer_account_holder, transfer_account_number, transfer_note')
    .limit(1)
    .single();

  if (error) {
    console.error('Error cargando configuración:', error);
    return;
  }

  settingsId = data.id;
  document.getElementById('input-whatsapp').value = data.whatsapp_number;
  document.getElementById('input-transfer-bank').value = data.transfer_bank_name ?? '';
  document.getElementById('input-transfer-holder').value = data.transfer_account_holder ?? '';
  document.getElementById('input-transfer-account').value = data.transfer_account_number ?? '';
  document.getElementById('input-transfer-note').value = data.transfer_note ?? '';
}

function activarFormulario() {
  const form = document.getElementById('form-configuracion');
  const statusEl = document.getElementById('configuracion-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.hidden = true;

    const numero = document.getElementById('input-whatsapp').value.trim();
    const transferBank = document.getElementById('input-transfer-bank').value.trim();
    const transferHolder = document.getElementById('input-transfer-holder').value.trim();
    const transferAccount = document.getElementById('input-transfer-account').value.trim();
    const transferNote = document.getElementById('input-transfer-note').value.trim();

    const { error } = await supabaseClient
      .from('settings')
      .update({
        whatsapp_number: numero,
        transfer_bank_name: transferBank,
        transfer_account_holder: transferHolder,
        transfer_account_number: transferAccount,
        transfer_note: transferNote,
      })
      .eq('id', settingsId);

    if (error) {
      console.error('Error guardando configuración:', error);
      statusEl.textContent = 'No pudimos guardar los cambios.';
    } else {
      statusEl.textContent = '✓ Guardado — el sitio ya usa este número.';
    }
    statusEl.hidden = false;
  });
}

async function iniciar() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('admin-header-container').innerHTML = renderAdminHeader('configuracion');
  activarAdminHeader();
  document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

  await cargarConfiguracion();
  activarFormulario();
}

document.addEventListener('DOMContentLoaded', iniciar);