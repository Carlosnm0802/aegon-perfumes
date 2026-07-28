import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type NotifyEvent = "created" | "status_changed";
type OrderStatus = "pendiente" | "preparando" | "enviado" | "entregado";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
};

const BASE_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Aegon Perfumes <onboarding@resend.dev>";
const DEFAULT_WHATSAPP_NUMBER = "521234567890";

function shortOrderId(orderId: string) {
  return orderId.split("-")[0].toUpperCase();
}

function buildEventKey(orderId: string, eventType: NotifyEvent, statusTo?: OrderStatus) {
  if (eventType === "created") return `created:${orderId}`;
  return `status:${orderId}:${statusTo ?? "unknown"}`;
}

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDelivery(deliveryType: string) {
  if (deliveryType === "local") return "Recoger en persona";
  if (deliveryType === "envio_local") return "Envío local";
  if (deliveryType === "paqueteria") return "Paquetería nacional";
  return deliveryType;
}

function normalizePhoneToDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function buildWhatsappUrl(phone: string, orderId: string) {
  const cleanPhone = normalizePhoneToDigits(phone) || DEFAULT_WHATSAPP_NUMBER;
  const text = encodeURIComponent(`Hola, tengo una duda sobre mi pedido #${shortOrderId(orderId)}.`);
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

function buildMessageByEvent(eventType: NotifyEvent, statusTo: OrderStatus, orderId: string) {
  const idCorto = shortOrderId(orderId);

  if (eventType === "created") {
    return {
      subject: `Recibimos tu pedido #${idCorto} — Aegon Perfumes`,
      title: "Recibimos tu pedido",
      intro: "Gracias por comprar en Aegon Perfumes. Tu pedido ya está registrado y pronto comenzaremos a prepararlo.",
      body: "Te avisaremos por este medio cada vez que cambie el estado de tu pedido.",
    };
  }

  if (statusTo === "preparando") {
    return {
      subject: `Tu pedido #${idCorto} está en preparación`,
      title: "Estamos preparando tu pedido",
      intro: "Tu fragancia ya está en proceso de preparación.",
      body: "Cuando salga para entrega o paquetería, te enviaremos otra actualización.",
    };
  }

  if (statusTo === "enviado") {
    return {
      subject: `Tu pedido #${idCorto} ya fue enviado`,
      title: "Tu pedido va en camino",
      intro: "Tu pedido ya fue enviado.",
      body: "Si surge cualquier duda con la entrega, puedes responder este correo o escribirnos por WhatsApp.",
    };
  }

  if (statusTo === "entregado") {
    return {
      subject: `Tu pedido #${idCorto} fue entregado`,
      title: "Pedido entregado",
      intro: "Confirmamos que tu pedido ya fue entregado.",
      body: "Gracias por confiar en Aegon Perfumes. Será un gusto atenderte de nuevo.",
    };
  }

  return {
    subject: `Actualización de tu pedido #${idCorto}`,
    title: "Actualización de pedido",
    intro: `El estado de tu pedido cambió a ${STATUS_LABELS[statusTo] ?? statusTo}.`,
    body: "Seguiremos informándote por este medio.",
  };
}

function buildEmailHtml(args: {
  customerName: string;
  orderId: string;
  statusTo: OrderStatus;
  eventType: NotifyEvent;
  whatsappUrl: string;
  deliveryType: string;
  deliveryAddress: string | null;
  total: number;
  items: Array<{ name: string; sizeLabel: string; quantity: number; unitPrice: number }>;
}) {
  const { customerName, orderId, statusTo, eventType, whatsappUrl, deliveryType, deliveryAddress, total, items } = args;
  const copy = buildMessageByEvent(eventType, statusTo, orderId);

  const itemsHtml = items
    .map((item) => {
      const subtotal = item.unitPrice * item.quantity;
      return `
        <tr>
          <td style="padding:8px 0;color:#121214;font-size:14px;">
            ${escapeHtml(item.name)} — ${escapeHtml(item.sizeLabel)} x ${item.quantity}
          </td>
          <td style="padding:8px 0;color:#121214;font-size:14px;text-align:right;">
            ${formatMoney(subtotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
  <div style="margin:0;padding:24px;background:#f5f5f6;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" style="max-width:640px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e8ec;">
      <tr>
        <td style="padding:22px 24px;background:#121214;color:#ffffff;">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;letter-spacing:1px;">AEGON <span style="color:#C5A059;">PERFUMES</span></div>
          <div style="margin-top:6px;font-size:13px;color:#a0a0a5;">Notificación automática de pedido</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#121214;font-family:'Cormorant Garamond',Georgia,serif;">${escapeHtml(copy.title)}</h2>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#2c2c31;">Hola ${escapeHtml(customerName)},</p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#2c2c31;">${escapeHtml(copy.intro)}</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#2c2c31;">${escapeHtml(copy.body)}</p>

          <div style="margin:0 0 16px;padding:12px 14px;border:1px solid #ececf1;border-radius:8px;background:#fafafb;">
            <div style="font-size:13px;color:#6f6f76;margin-bottom:4px;">Pedido</div>
            <div style="font-size:16px;font-weight:600;color:#121214;">#${escapeHtml(shortOrderId(orderId))}</div>
            <div style="margin-top:6px;font-size:13px;color:#6f6f76;">Estado: <strong style="color:#121214;">${escapeHtml(STATUS_LABELS[statusTo] ?? statusTo)}</strong></div>
            <div style="margin-top:6px;font-size:13px;color:#6f6f76;">Entrega: <strong style="color:#121214;">${escapeHtml(formatDelivery(deliveryType))}</strong></div>
            ${deliveryAddress ? `<div style="margin-top:6px;font-size:13px;color:#6f6f76;">Dirección: <strong style="color:#121214;">${escapeHtml(deliveryAddress)}</strong></div>` : ""}
          </div>

          <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 8px;">
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="margin-top:10px;padding-top:10px;border-top:1px solid #ececf1;text-align:right;font-size:16px;color:#121214;">
            <strong>Total: ${formatMoney(total)}</strong>
          </div>

          <div style="margin-top:18px;">
            <a
              href="${escapeHtml(whatsappUrl)}"
              target="_blank"
              rel="noopener"
              style="display:inline-block;padding:12px 16px;background:#25D366;color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;font-size:14px;"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#fafafb;border-top:1px solid #ececf1;font-size:12px;color:#7d7d84;line-height:1.5;">
          Este correo fue enviado automáticamente por Aegon Perfumes.
        </td>
      </tr>
    </table>
  </div>`;

  return { ...copy, html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { orderId, eventType, statusTo, forceResend } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId es obligatorio." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const normalizedEventType: NotifyEvent = eventType === "status_changed" ? "status_changed" : "created";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan secretos de Supabase (URL o SERVICE_ROLE_KEY).");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, customer_name, customer_email, delivery_type, delivery_address, status, total")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
      return new Response(JSON.stringify({ error: "Pedido no encontrado." }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const effectiveStatus = (statusTo || order.status) as OrderStatus;
    const allowedStatuses: OrderStatus[] = ["pendiente", "preparando", "enviado", "entregado"];
    if (!allowedStatuses.includes(effectiveStatus)) {
      return new Response(JSON.stringify({ error: "statusTo inválido." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const eventKey = buildEventKey(order.id, normalizedEventType, effectiveStatus);

    const { data: existingSent, error: sentError } = await supabaseAdmin
      .from("order_email_logs")
      .select("id")
      .eq("event_key", eventKey)
      .eq("success", true)
      .limit(1);

    if (sentError) throw sentError;

    if ((existingSent ?? []).length > 0 && !forceResend) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          duplicate: true,
          message: "Este evento ya fue enviado previamente.",
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (!order.customer_email) {
      await supabaseAdmin.from("order_email_logs").insert({
        order_id: order.id,
        event_key: eventKey,
        event_type: normalizedEventType,
        status_to: effectiveStatus,
        provider: "resend",
        success: false,
        skipped: true,
        error_message: "Pedido sin correo del cliente.",
        metadata: { reason: "missing_customer_email" },
      });

      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          warning: "Pedido sin correo del cliente. No se envió notificación.",
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("quantity, unit_price, variant:variants(size_label, product:products(name))")
      .eq("order_id", order.id);

    if (itemsError) throw itemsError;

    const normalizedItems = (items ?? []).map((item: any) => ({
      name: item.variant?.product?.name ?? "Perfume",
      sizeLabel: item.variant?.size_label ?? "Variante",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    }));

    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("whatsapp_number")
      .limit(1)
      .maybeSingle();

    const whatsappNumber = settingsData?.whatsapp_number || Deno.env.get("ORDER_WHATSAPP_NUMBER") || DEFAULT_WHATSAPP_NUMBER;
    const whatsappUrl = buildWhatsappUrl(whatsappNumber, order.id);

    const emailPayload = buildEmailHtml({
      customerName: order.customer_name,
      orderId: order.id,
      statusTo: effectiveStatus,
      eventType: normalizedEventType,
      whatsappUrl,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      total: Number(order.total),
      items: normalizedItems,
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("Falta configurar RESEND_API_KEY en Supabase.");
    }

    const from = Deno.env.get("ORDER_EMAIL_FROM") || DEFAULT_FROM;
    const replyTo = Deno.env.get("ORDER_EMAIL_REPLY_TO") || undefined;

    const resendResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [order.customer_email],
        subject: emailPayload.subject,
        html: emailPayload.html,
        reply_to: replyTo,
      }),
    });

    const resendRaw = await resendResponse.text();

    if (!resendResponse.ok) {
      await supabaseAdmin.from("order_email_logs").insert({
        order_id: order.id,
        event_key: eventKey,
        event_type: normalizedEventType,
        status_to: effectiveStatus,
        recipient_email: order.customer_email,
        provider: "resend",
        subject: emailPayload.subject,
        success: false,
        skipped: false,
        error_message: `Resend respondió ${resendResponse.status}`,
        provider_response: resendRaw.slice(0, 4000),
        metadata: { forceResend: Boolean(forceResend) },
      });

      return new Response(
        JSON.stringify({ error: "No se pudo enviar el correo.", details: resendRaw }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseAdmin.from("order_email_logs").insert({
      order_id: order.id,
      event_key: eventKey,
      event_type: normalizedEventType,
      status_to: effectiveStatus,
      recipient_email: order.customer_email,
      provider: "resend",
      subject: emailPayload.subject,
      success: true,
      skipped: false,
      sent_at: new Date().toISOString(),
      provider_response: resendRaw.slice(0, 4000),
      metadata: { forceResend: Boolean(forceResend) },
    });

    return new Response(
      JSON.stringify({ ok: true, sent: true, eventKey }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en notificar-pedido:", error);
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
