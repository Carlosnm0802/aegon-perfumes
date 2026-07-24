import { supabaseClient } from '../supabase-client.js';
import { requireAuth, cerrarSesion } from './auth-guard.js';
import { renderAdminHeader, activarAdminHeader } from './admin-header.js';

// Guardamos el id real de la fila (tu tabla usa uuid, no un id
// fijo) para poder actualizarla — lo leemos una vez al cargar.
let settingsId = null;

async function cargarConfiguracion() {
  const { data, error } = await supabaseClient
    .from('settings')
    .select('id, whatsapp_number, instagram_url, tiktok_url, instagram_image_1, instagram_image_2, instagram_image_3, instagram_image_4, instagram_image_5, instagram_image_6, transfer_bank_name, transfer_account_holder, transfer_account_number, transfer_note')
    .limit(1)
    .single();

  if (error) {
    console.error('Error cargando configuración:', error);
    return;
  }

  settingsId = data.id;
  document.getElementById('input-whatsapp').value = data.whatsapp_number;
  document.getElementById('input-instagram').value = data.instagram_url ?? '';
  document.getElementById('input-tiktok').value = data.tiktok_url ?? '';
  document.getElementById('input-instagram-image-1').value = data.instagram_image_1 ?? '';
  document.getElementById('input-instagram-image-2').value = data.instagram_image_2 ?? '';
  document.getElementById('input-instagram-image-3').value = data.instagram_image_3 ?? '';
  document.getElementById('input-instagram-image-4').value = data.instagram_image_4 ?? '';
  document.getElementById('input-instagram-image-5').value = data.instagram_image_5 ?? '';
  document.getElementById('input-instagram-image-6').value = data.instagram_image_6 ?? '';
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
    const instagramUrl = document.getElementById('input-instagram').value.trim();
    const tiktokUrl = document.getElementById('input-tiktok').value.trim();
    const instagramImage1 = document.getElementById('input-instagram-image-1').value.trim();
    const instagramImage2 = document.getElementById('input-instagram-image-2').value.trim();
    const instagramImage3 = document.getElementById('input-instagram-image-3').value.trim();
    const instagramImage4 = document.getElementById('input-instagram-image-4').value.trim();
    const instagramImage5 = document.getElementById('input-instagram-image-5').value.trim();
    const instagramImage6 = document.getElementById('input-instagram-image-6').value.trim();
    const transferBank = document.getElementById('input-transfer-bank').value.trim();
    const transferHolder = document.getElementById('input-transfer-holder').value.trim();
    const transferAccount = document.getElementById('input-transfer-account').value.trim();
    const transferNote = document.getElementById('input-transfer-note').value.trim();

    const { error } = await supabaseClient
      .from('settings')
      .update({
        whatsapp_number: numero,
        instagram_url: instagramUrl,
        tiktok_url: tiktokUrl,
        instagram_image_1: instagramImage1,
        instagram_image_2: instagramImage2,
        instagram_image_3: instagramImage3,
        instagram_image_4: instagramImage4,
        instagram_image_5: instagramImage5,
        instagram_image_6: instagramImage6,
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