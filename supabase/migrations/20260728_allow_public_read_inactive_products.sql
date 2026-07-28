-- Permite listar productos inactivos en catálogo público para mostrarlos como
-- "No disponible" sin habilitar su compra.

-- Reemplazamos la política pública previa (solo activos).
drop policy if exists "products: lectura pública de activos" on products;

create policy "products: lectura pública"
  on products for select
  using (true);
