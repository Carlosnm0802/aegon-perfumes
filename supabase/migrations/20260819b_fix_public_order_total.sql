-- Corrige la validación del total para respetar descuentos de variantes.
create or replace function create_public_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_type text,
  p_delivery_address text,
  p_total numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item record;
  v_variant record;
  v_total numeric(10,2) := 0;
begin
  if nullif(trim(p_customer_name), '') is null
    or nullif(trim(p_customer_phone), '') is null then
    raise exception 'El pedido requiere nombre y teléfono';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe incluir al menos un item';
  end if;

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

    select id, price, discount_percentage, type, stock, available
      into v_variant
      from variants
     where id = v_item.variant_id
     for update;

    if v_variant.id is null then
      raise exception 'Variante no encontrada';
    end if;
    if not v_variant.available or v_variant.stock < v_item.quantity then
      raise exception 'Uno de los productos ya no está disponible';
    end if;

    v_total := v_total + (
      case
        when v_variant.type = 'completo' then
          v_variant.price * (1 - coalesce(v_variant.discount_percentage, 0) / 100)
        else v_variant.price
      end * v_item.quantity
    );
  end loop;

  if p_total < v_total then
    raise exception 'El total del pedido no es válido';
  end if;

  insert into orders (
    customer_name, customer_phone, customer_email, delivery_type,
    delivery_address, status, total
  )
  values (
    trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''),
    p_delivery_type, nullif(trim(p_delivery_address), ''), 'pendiente', p_total
  )
  returning id into v_order_id;

  for v_item in
    select
      (item->>'variant_id')::uuid as variant_id,
      sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by (item->>'variant_id')::uuid
  loop
    insert into order_items (order_id, variant_id, quantity, unit_price)
    select v_order_id, v_item.variant_id, v_item.quantity,
      case
        when v.type = 'completo' then v.price * (1 - coalesce(v.discount_percentage, 0) / 100)
        else v.price
      end
      from variants v
     where v.id = v_item.variant_id;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function create_public_order(text, text, text, text, text, numeric, jsonb) from public;
grant execute on function create_public_order(text, text, text, text, text, numeric, jsonb) to anon, authenticated;