-- Migración: agrega control de inventario a variants.
-- Contexto: antes del pivote sin pasarela de pago, el stock no se
-- descontaba automáticamente. Ahora se descuenta al momento en que el
-- dueño confirma un pedido pagado desde el panel admin.
alter table variants
  add column stock integer not null default 0
  check (stock >= 0);

comment on column variants.stock is
  'Inventario disponible. Se descuenta exclusivamente a través de la función
   create_order_and_deduct_stock() al confirmar un pedido pagado. No debe
   actualizarse manualmente desde el panel salvo para ajustes de inventario.';