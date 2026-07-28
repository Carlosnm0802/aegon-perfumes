-- Registro de envíos de correo por pedido para deduplicar eventos
-- y soportar reintentos controlados.

create table if not exists order_email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event_key text not null,
  event_type text not null,
  status_to order_status,
  recipient_email text,
  provider text not null default 'resend',
  subject text,
  success boolean not null default false,
  skipped boolean not null default false,
  error_message text,
  provider_response text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_email_logs_order_id on order_email_logs(order_id);
create index if not exists idx_order_email_logs_event_key on order_email_logs(event_key);
create index if not exists idx_order_email_logs_success on order_email_logs(success);

alter table order_email_logs enable row level security;

-- Solo backend/service-role opera esta tabla.
create policy "order_email_logs: sin acceso público"
  on order_email_logs for all
  using (false)
  with check (false);
