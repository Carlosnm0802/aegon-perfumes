-- El estado pendiente conserva el enum existente: en el flujo nuevo el pago
-- ya fue confirmado fuera del sistema antes de registrar el pedido. Por eso
-- aquí significa "recién registrado, esperando preparación", no "esperando
-- pago". No se agrega un valor pagado al enum order_status.
comment on column orders.status is
  'Estado operativo. pendiente significa recién registrado y esperando preparación; el pago ya fue confirmado manualmente antes de crear el pedido.';

-- Crea un pedido ya confirmado como pagado y descuenta stock de forma
-- atómica. Si una variante no existe, la cantidad es inválida o el stock
-- total solicitado es insuficiente, PostgreSQL revierte toda la operación.
--
-- Se usa security invoker para que la función conserve los permisos y las
-- políticas RLS del usuario autenticado que la invoca desde el panel.
create or replace function create_order_and_deduct_stock(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_type text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_order_id uuid;
  v_item record;
  v_variant record;
  v_total numeric(10,2) := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe incluir al menos un item';
  end if;

  -- Agrupar por variante evita que dos líneas repetidas oculten una
  -- cantidad total superior al stock disponible.
  for v_item in
    select
      (item->>'variant_id')::uuid as variant_id,
      sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by (item->>'variant_id')::uuid
  loop
    if v_item.variant_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Cada item debe incluir una variante y una cantidad positiva';
    end if;

    select id, price, stock
      into v_variant
      from variants
     where id = v_item.variant_id
     for update;

    if v_variant.id is null then
      raise exception 'Variante % no encontrada', v_item.variant_id;
    end if;

    if v_variant.stock < v_item.quantity then
      raise exception 'Stock insuficiente para variante %: disponible %, solicitado %',
        v_item.variant_id, v_variant.stock, v_item.quantity;
    end if;

    v_total := v_total + (v_variant.price * v_item.quantity);
  end loop;

  -- pendiente significa recién registrado y esperando preparación; no
  -- significa esperando pago porque el pago ya fue confirmado previamente.
  insert into orders (customer_name, customer_phone, delivery_type, status, total)
  values (p_customer_name, p_customer_phone, p_delivery_type, 'pendiente', v_total)
  returning id into v_order_id;

  -- Inserta una sola fila por variante ya consolidada y descuenta el
  -- stock total correspondiente.
  for v_item in
    select
      (item->>'variant_id')::uuid as variant_id,
      sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by (item->>'variant_id')::uuid
  loop
    insert into order_items (order_id, variant_id, quantity, unit_price)
    select v_order_id, v_item.variant_id, v_item.quantity, price
      from variants
     where id = v_item.variant_id;

    update variants
       set stock = stock - v_item.quantity
     where id = v_item.variant_id;
  end loop;

  return v_order_id;
end;
$$;

-- Reemplaza la inserción pública del flujo antiguo, en el que el cliente
-- creaba el pedido antes del redirect de Stripe. Ahora solo el panel admin
-- autenticado puede crear pedidos, mediante la función anterior.
drop policy if exists "orders: insertar públicamente" on orders;
drop policy if exists "order_items: insertar públicamente" on order_items;

create policy "orders: insertar solo admin autenticado"
  on orders for insert
  to authenticated
  with check (true);

create policy "order_items: insertar solo admin autenticado"
  on order_items for insert
  to authenticated
  with check (true);