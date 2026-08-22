import { supabaseClient } from './supabase-client.js';

const NUMERO_POR_DEFECTO = '521234567890';
const INSTAGRAM_POR_DEFECTO = 'https://www.instagram.com/aegonparfums';
const TIKTOK_POR_DEFECTO = 'https://www.tiktok.com';
const INSTAGRAM_IMAGENES_POR_DEFECTO = [
  'assets/images/image2.png',
  'assets/images/WhatsApp%20Image%202026-08-06%20at%2012.40.30%20%287%29.jpeg',
  'assets/images/WhatsApp%20Image%202026-08-06%20at%2012.40.30%20%288%29.jpeg',
  'assets/images/WhatsApp%20Image%202026-08-06%20at%2012.40.30%20%284%29.jpeg',
  'assets/images/image5.png',
  'assets/images/WhatsApp%20Image%202026-08-06%20at%2012.40.30%20%2811%29.jpeg',
];
const IMAGENES_INSTAGRAM_ANTERIORES = [
  'https://images.unsplash.com/photo-1505239034653-abfc95288b6c?w=300&h=300&fit=crop&q=70&auto=format',
  'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=300&h=300&fit=crop&q=70&auto=format&fp-x=0.3',
  'https://images.unsplash.com/photo-1543422655-ac1c6ca993ed?w=300&h=300&fit=crop&q=70&auto=format&fp-x=0.7',
  'https://images.unsplash.com/photo-1749264361617-dbe17a223f54?w=300&h=300&fit=crop&q=70&auto=format&fp-x=0.4',
  'https://images.unsplash.com/photo-1557170334-a9086f3f5c9b?w=300&h=300&fit=crop&q=70&auto=format',
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&h=300&fit=crop&q=70&auto=format',
];
const TRANSFERENCIA_POR_DEFECTO = {
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  note: 'Usa tu numero de pedido como concepto y envia tu comprobante por WhatsApp.',
};

let settingsCachePromise = null;

async function obtenerSettings() {
  if (!settingsCachePromise) {
    settingsCachePromise = supabaseClient
      .from('settings')
      .select('whatsapp_number, instagram_url, tiktok_url, instagram_image_1, instagram_image_2, instagram_image_3, instagram_image_4, instagram_image_5, instagram_image_6, transfer_bank_name, transfer_account_holder, transfer_account_number, transfer_note')
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('Error obteniendo configuración de settings, usando respaldos:', error);
          return null;
        }
        return data;
      })
      .catch((error) => {
        console.error('Error inesperado leyendo settings, usando respaldos:', error);
        return null;
      });
  }

  return settingsCachePromise;
}

function normalizarUrl(url, fallback) {
  const valor = (url ?? '').trim();
  if (!valor) return fallback;
  return /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
}

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
  const data = await obtenerSettings();
  return data?.whatsapp_number || NUMERO_POR_DEFECTO;
}

export async function obtenerDatosTransferencia() {
  const data = await obtenerSettings();

  if (!data) {
    return TRANSFERENCIA_POR_DEFECTO;
  }

  return {
    bankName: data.transfer_bank_name ?? '',
    accountHolder: data.transfer_account_holder ?? '',
    accountNumber: data.transfer_account_number ?? '',
    note: data.transfer_note || TRANSFERENCIA_POR_DEFECTO.note,
  };
}

export async function obtenerSocialLinks() {
  const data = await obtenerSettings();
  return {
    instagramUrl: normalizarUrl(data?.instagram_url, INSTAGRAM_POR_DEFECTO),
    tiktokUrl: normalizarUrl(data?.tiktok_url, TIKTOK_POR_DEFECTO),
  };
}

export async function obtenerInstagramGallery() {
  const data = await obtenerSettings();
  const instagramUrl = normalizarUrl(data?.instagram_url, INSTAGRAM_POR_DEFECTO);

  const imageUrls = INSTAGRAM_IMAGENES_POR_DEFECTO.map((fallback, index) => {
    const key = `instagram_image_${index + 1}`;
    const value = (data?.[key] ?? '').trim();
    return !value || IMAGENES_INSTAGRAM_ANTERIORES.includes(value) ? fallback : value;
  });

  return { instagramUrl, imageUrls };
}