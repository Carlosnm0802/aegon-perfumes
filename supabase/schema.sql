-- ============================================
-- AegonPerfumes — schema.sql
-- ============================================

-- Habilita gen_random_uuid() para los IDs de todas las tablas
create extension if not exists "pgcrypto";

-- Tipo de producto: decant preparado a mano vs. frasco original sellado
create type product_type as enum (
  'decant',
  'completo'
);

-- Estado del pedido, en el orden real del flujo operativo del negocio
create type order_status as enum (
  'pendiente',
  'preparando',
  'enviado',
  'entregado'
);

-- Nota: orders.delivery_type se queda como TEXT (no enum) — decisión
-- tomada en Fase 4 para permitir agregar nuevos métodos de entrega
-- (ej. "uber_didi") sin necesitar una migración con ALTER TYPE.

-- ============================================

-- ---------- categories ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);
alter table categories enable row level security;

-- ---------- brands ----------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);
alter table brands enable row level security;

-- ---------- products ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  type product_type not null,
  category_id uuid references categories(id) on delete set null,
  brand_id uuid references brands(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table products enable row level security;

-- ---------- variants ----------
create table variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size_label text not null,
  price numeric(10,2) not null check (price >= 0),
  available boolean not null default true
);
alter table variants enable row level security;

-- ---------- orders ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_type text not null default 'local',
  delivery_address text,
  status order_status not null default 'pendiente',
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
alter table orders enable row level security;

-- ---------- order_items ----------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);
alter table order_items enable row level security;
-- ============================================

-- ---------- categories: lectura pública, sin escritura pública ----------
create policy "categories: lectura pública"
  on categories for select
  using (true);

-- ---------- brands: lectura pública, sin escritura pública ----------
create policy "brands: lectura pública"
  on brands for select
  using (true);

-- ---------- products: lectura pública SOLO de productos activos ----------
create policy "products: lectura pública de activos"
  on products for select
  using (is_active = true);

-- ---------- variants: lectura pública ----------
-- Nota: no filtramos por "available" aquí — el frontend decide si muestra
-- la variante agotada con un badge, en vez de ocultarla por completo.
-- Así el cliente ve que existe el tamaño aunque esté agotado hoy.
create policy "variants: lectura pública"
  on variants for select
  using (true);

-- ---------- orders: cualquiera puede CREAR un pedido, nadie puede leerlos ----------
create policy "orders: insertar públicamente"
  on orders for insert
  with check (true);

-- ---------- order_items: mismo criterio que orders ----------
create policy "order_items: insertar públicamente"
  on order_items for insert
  with check (true);

-- ============================================
-- Políticas "solo admin" — se activan en Fase 5, Bloque 9
-- cuando exista Supabase Auth y un rol identificable.
-- Quedan documentadas aquí para no perder la decisión de Fase 2.
-- ============================================

-- create policy "categories: solo admin escribe"
--   on categories for insert
--   with check (auth.role() = 'authenticated');
--
-- (mismo patrón se replica para update/delete en categories, brands,
--  products, variants, y para select/update en orders y order_items)
-- ---------- Fix de esquema: género, detectado al revisar el catálogo real ----------
create type product_gender as enum ('hombre', 'mujer', 'unisex');
alter table products add column gender product_gender not null;

-- ---------- Categorías ----------
insert into categories (name, slug) values
  ('Diseñador', 'disenador'),
  ('Árabe', 'arabe'),
  ('Nicho', 'nicho');

-- ---------- Marcas ----------
insert into brands (name, slug) values
  ('Yves Saint Laurent', 'ysl'),
  ('Giorgio Armani', 'giorgio-armani'),
  ('Carolina Herrera', 'carolina-herrera'),
  ('Christian Dior', 'dior'),
  ('Chanel', 'chanel'),
  ('Hugo Boss', 'hugo-boss'),
  ('Bond No. 9', 'bond-no-9'),
  ('Afnan', 'afnan'),
  ('Bharara Beauty', 'bharara'),
  ('Ariana Grande', 'ariana-grande'),
  ('Azzaro', 'azzaro');

-- ---------- Productos ----------
insert into products (name, description, image_url, type, gender, category_id, brand_id, is_active) values

('YSL "Y" EDP',
 'Fragancia amaderada aromática, con notas de bergamota, salvia y haba tonka.',
 'https://picsum.photos/seed/ysl-y-edp/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('YSL "Y" EDP (Decant)',
 'La misma fragancia YSL "Y", preparada a mano en tamaños fraccionados.',
 'https://picsum.photos/seed/ysl-y-decant/600/600',
 'decant', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Acqua di Gio Profondo',
 'Fragancia acuática amaderada, fresca y marina, ideal para uso diario.',
 'https://picsum.photos/seed/adg-profondo/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('Acqua di Gio Profondo (Decant)',
 'La misma fragancia Acqua di Gio Profondo, preparada a mano en tamaños fraccionados.',
 'https://picsum.photos/seed/adg-profondo-decant/600/600',
 'decant', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('212 VIP Black EDP',
 'Fragancia intensa y nocturna, con notas de café y ron.',
 'https://picsum.photos/seed/212-vip-black/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Dior Homme Intense',
 'Fragancia elegante y sofisticada, con notas de iris y ámbar.',
 'https://picsum.photos/seed/dior-homme-intense/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Gabrielle L''Eau',
 'Fragancia floral luminosa, fresca y femenina.',
 'https://picsum.photos/seed/gabrielle-leau/600/600',
 'completo', 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'chanel'), true),

('Black Opium EDT',
 'Fragancia oriental y vainillada, adictiva y moderna.',
 'https://picsum.photos/seed/black-opium/600/600',
 'completo', 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Boss Bottled Night',
 'Fragancia amaderada especiada, pensada para la noche.',
 'https://picsum.photos/seed/boss-bottled-night/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'hugo-boss'), true),

('Bond No. 9 Queens',
 'Fragancia de nicho neoyorquina, floral afrutada, unisex.',
 'https://picsum.photos/seed/bond-queens/600/600',
 'completo', 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'bond-no-9'), true),

('9pm EDP',
 'Fragancia árabe dulce y ahumada, con notas de vainilla y oud.',
 'https://picsum.photos/seed/afnan-9pm/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('Supremacy Not Only Intense',
 'Fragancia árabe intensa, amaderada y especiada de larga duración.',
 'https://picsum.photos/seed/afnan-supremacy/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('Bharara King',
 'Fragancia de nicho, fresca y amaderada con toque especiado.',
 'https://picsum.photos/seed/bharara-king/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'bharara'), true),

('Cloud Pink EDP',
 'Fragancia dulce y algodonada, ligera y juvenil.',
 'https://picsum.photos/seed/cloud-pink/600/600',
 'completo', 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('The Most Wanted EDP',
 'Fragancia descontinuada del catálogo — usada como prueba de producto inactivo.',
 'https://picsum.photos/seed/azzaro-most-wanted/600/600',
 'completo', 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'azzaro'), false);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, available) values
((select id from products where name = 'YSL "Y" EDP'), '100ml', 2800, true),

((select id from products where name = 'YSL "Y" EDP (Decant)'), '5ml', 450, true),
((select id from products where name = 'YSL "Y" EDP (Decant)'), '10ml', 780, true),

((select id from products where name = 'Acqua di Gio Profondo'), '100ml', 2700, true),

((select id from products where name = 'Acqua di Gio Profondo (Decant)'), '5ml', 420, true),
((select id from products where name = 'Acqua di Gio Profondo (Decant)'), '10ml', 750, true),

((select id from products where name = '212 VIP Black EDP'), '100ml', 2180, true),
((select id from products where name = 'Dior Homme Intense'), '100ml', 2850, true),
((select id from products where name = 'Gabrielle L''Eau'), '100ml', 3999, true),
((select id from products where name = 'Black Opium EDT'), '90ml', 2800, true),
((select id from products where name = 'Boss Bottled Night'), '100ml', 1200, true),
((select id from products where name = 'Bond No. 9 Queens'), '100ml', 4500, true),
((select id from products where name = '9pm EDP'), '100ml', 800, true),
((select id from products where name = 'Supremacy Not Only Intense'), '100ml', 1350, true),
((select id from products where name = 'Bharara King'), '100ml', 1550, true),
((select id from products where name = 'Cloud Pink EDP'), '100ml', 1450, true),
((select id from products where name = 'The Most Wanted EDP'), '100ml', 1950, true);
-- ============================================

-- Lectura pública de imágenes de producto (cualquiera puede VER)
create policy "product-images: lectura pública"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- ============================================
-- Política "solo admin sube/borra" — se activa en Fase 5, Bloque 9
-- cuando exista Supabase Auth, mismo criterio que las tablas.
-- ============================================

-- create policy "product-images: solo admin sube"
--   on storage.objects for insert
--   with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
--
-- create policy "product-images: solo admin borra"
--   on storage.objects for delete
--   using (bucket_id = 'product-images' and auth.role() = 'authenticated');
-- ============================================
-- AegonPerfumes — schema.sql
-- Bloque 4.5.1: Mover `type` de products a variants (versión final)
-- ============================================

alter table variants add column type product_type;

update variants v
set type = p.type
from products p
where v.product_id = p.id;

alter table variants alter column type set not null;

update variants
set product_id = (select id from products where name = 'YSL "Y" EDP')
where product_id = (select id from products where name = 'YSL "Y" EDP (Decant)');

update variants
set product_id = (select id from products where name = 'Acqua di Gio Profondo')
where product_id = (select id from products where name = 'Acqua di Gio Profondo (Decant)');

delete from products
where name in ('YSL "Y" EDP (Decant)', 'Acqua di Gio Profondo (Decant)');

alter table products drop column type;


---Politica para darle acceso a lectura total al admin sobre sus productos
create policy "products: lectura completa para admin"
  on products for select
  to authenticated
  using (true);

---el admin puede actualizar estado de los productos
create policy "products: actualizar solo admin"
  on products for update
  to authenticated
  using (true)
  with check (true);
  ---puede actualizar variantes
  create policy "variants: actualizar solo admin"
  on variants for update
  to authenticated
  using (true)
  with check (true);

create policy "product-images: admin sube"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');
create policy "product-images: admin actualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "products: insertar solo admin"
  on products for insert
  to authenticated
  with check (true);
create policy "variants: insertar solo admin"
  on variants for insert
  to authenticated
  with check (true);

create policy "orders: lectura solo admin"
  on orders for select
  to authenticated
  using (true);
create policy "orders: actualizar solo admin"
  on orders for update
  to authenticated
  using (true)
  with check (true);
create policy "order_items: lectura solo admin"
  on order_items for select
  to authenticated
  using (true);

create policy "categories: insertar solo admin"
  on categories for insert
  to authenticated
  with check (true);

create policy "brands: insertar solo admin"
  on brands for insert
  to authenticated
  with check (true);