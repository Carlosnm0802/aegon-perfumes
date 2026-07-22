// ============================================================
// BOTÓN FLOTANTE DE WHATSAPP
// ============================================================
// Visible en toda la página, independiente del footer. Se
// inyecta con renderWhatsappFloat() dentro de un contenedor
// vacío al final del <body> de cada página.
//
// [ALERTA] El número sigue siendo el de ejemplo (521234567890).
// Reemplazar por el número real del negocio antes de producción
// (Bloque 8 o antes, si el cliente ya lo tiene).
// ============================================================

export function renderWhatsappFloat(numeroWhatsapp) {
  return `
    <a href="https://wa.me/${numeroWhatsapp}?text=Hola%2C%20tengo%20una%20duda%20sobre%20sus%20perfumes"
       target="_blank" rel="noopener"
       class="whatsapp-float" aria-label="Escríbenos por WhatsApp">
      <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.6 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.6-.1 1.1z"/></svg>
    </a>
  `;
}