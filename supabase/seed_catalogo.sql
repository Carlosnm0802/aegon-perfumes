-- ============================================
-- AegonPerfumes — seed_catalogo.sql
-- Script vivo: se va ampliando con cada lote de productos reales
-- que reemplazan los datos de prueba de schema.sql.
--
-- Convenciones asumidas para este catálogo:
-- - type de variante: 'completo' (frasco sellado), salvo que se indique 'decant'.
-- - gender: se infiere del producto; si es ambiguo, se usa 'unisex'.
-- - category: 'disenador' para marcas de diseñador (YSL, Armani, CH, Mugler...),
--   'arabe' para AFNAN / Lattafa / French Avenue, 'nicho' para el resto de nicho.
-- - stock y discount_percentage se dejan en su default (0) — el admin los ajusta
--   desde el panel.
-- ============================================

-- ---------- 0. Limpieza de datos de prueba del schema.sql original ----------
-- Se borran primero order_items/orders (pedidos de prueba) porque
-- order_items.variant_id tiene FK "restrict" hacia variants.
delete from order_items;
delete from orders;
delete from variants;
delete from products;

-- ---------- 1. Marcas nuevas detectadas en el catálogo real ----------
insert into brands (name, slug) values
  ('French Avenue', 'french-avenue'),
  ('Lattafa', 'lattafa'),
  ('Mugler', 'mugler'),
  ('Burberry', 'burberry'),
  ('Bvlgari', 'bvlgari'),
  ('Cartier', 'cartier'),
  ('Dolce & Gabbana', 'dolce-gabbana'),
  ('Paco Rabanne', 'paco-rabanne'),
  ('Ryhaan', 'ryhaan'),
  ('Elish', 'elish'),
  ('Game of Spades', 'game-of-spades'),
  ('Rasasi', 'rasasi'),
  ('Halloween', 'halloween'),
  ('Zimaya', 'zimaya'),
  ('Givenchy', 'givenchy'),
  ('Jean Paul Gaultier', 'jean-paul-gaultier'),
  ('Lancôme', 'lancome'),
  ('Guerlain', 'guerlain'),
  ('Montale', 'montale'),
  ('Montblanc', 'montblanc'),
  ('Moschino', 'moschino'),
  ('Odyssey', 'odyssey'),
  ('Prada', 'prada'),
  ('Viktor & Rolf', 'viktor-rolf'),
  ('Tous', 'tous'),
  ('Valentino', 'valentino'),
  ('Versace', 'versace'),
  ('Xerjoff', 'xerjoff')
on conflict (slug) do nothing;

-- ============================================
-- LOTE 1
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('YSL "Y" EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('YSL "Y" EDP Intense', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('YSL "Y" EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('YSL "Y" Le Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('212 VIP EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('212 VIP EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('212 VIP Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('9pm EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('9pm Elixir', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('9pm Night Out Extrait', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('9pm Rebel', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('Acqua di Gio Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('Acqua di Gio Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('Acqua di Gio Profondo EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('Acqua di Gio Profondo Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('Acqua di Gio EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'giorgio-armani'), true),

('Aether EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'french-avenue'), true),

('Afeef EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('Supremacy Collector''s Edition EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('Supremacy Not Only Intense', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'afnan'), true),

('Alien EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'mugler'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'YSL "Y" EDP'), '100ml', 2800, 'completo', true),
((select id from products where name = 'YSL "Y" EDP Intense'), '100ml', 2900, 'completo', true),
((select id from products where name = 'YSL "Y" EDT'), '100ml', 2500, 'completo', true),
((select id from products where name = 'YSL "Y" Le Parfum'), '100ml', 2800, 'completo', true),

((select id from products where name = '212 VIP EDP'), '100ml', 2180, 'completo', true),
-- Nota: precio original venía como rango "$1,950 - $2,400". Se dejó el
-- valor bajo; ajustar manualmente o pedir una 2da variante si aplica.
((select id from products where name = '212 VIP EDT'), '100ml', 1950, 'completo', true),
((select id from products where name = '212 VIP Elixir'), '100ml', 2300, 'completo', true),

((select id from products where name = '9pm EDP'), '100ml', 800, 'completo', true),
((select id from products where name = '9pm Elixir'), '100ml', 1280, 'completo', true),
((select id from products where name = '9pm Night Out Extrait'), '100ml', 1450, 'completo', true),
((select id from products where name = '9pm Rebel'), '100ml', 1350, 'completo', true),

((select id from products where name = 'Acqua di Gio Elixir'), '50ml', 2600, 'completo', true),
((select id from products where name = 'Acqua di Gio Parfum'), '100ml', 2800, 'completo', true),
((select id from products where name = 'Acqua di Gio Profondo EDP'), '100ml', 2550, 'completo', true),
((select id from products where name = 'Acqua di Gio Profondo Parfum'), '100ml', 2700, 'completo', true),
((select id from products where name = 'Acqua di Gio EDT'), '100ml', 1900, 'completo', true),

((select id from products where name = 'Aether EDP'), '100ml', 1350, 'completo', true),
((select id from products where name = 'Afeef EDP'), '100ml', 1300, 'completo', true),
((select id from products where name = 'Supremacy Collector''s Edition EDP'), '100ml', 1300, 'completo', true),
((select id from products where name = 'Supremacy Not Only Intense'), '100ml', 1350, 'completo', true),

((select id from products where name = 'Alien EDP'), '90ml', 2100, 'completo', true);

-- ============================================
-- LOTE 2
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Ariana Grande EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande Cloud EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande Cloud Pink EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande God Is A Woman EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande Mod Blush EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande Mod Vainilla EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande Moonlight EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande R.E.M. EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Ariana Grande Sweet Like Candy EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ariana-grande'), true),

('Art of Universe EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('Atlantis EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'french-avenue'), true),

('Atlas EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('The Most Wanted Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'azzaro'), true),

('The Most Wanted EDP Intense', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'azzaro'), true),

('Bad Boy Cobalt Elixir EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Bad Boy Cobalt EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Bad Boy EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Bad Boy Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Bad Boy Extreme EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Bad Boy Le Parfum EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Bharara King EDP', null, null, 'hombre',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'bharara'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Ariana Grande EDP'), '100ml', 1390, 'completo', true),
((select id from products where name = 'Ariana Grande Cloud EDP'), '100ml', 1590, 'completo', true),
((select id from products where name = 'Ariana Grande Cloud Pink EDP'), '100ml', 1450, 'completo', true),
((select id from products where name = 'Ariana Grande God Is A Woman EDP'), '100ml', 1350, 'completo', true),
((select id from products where name = 'Ariana Grande Mod Blush EDP'), '100ml', 1490, 'completo', true),
((select id from products where name = 'Ariana Grande Mod Vainilla EDP'), '100ml', 1490, 'completo', true),
((select id from products where name = 'Ariana Grande Moonlight EDP'), '100ml', 1350, 'completo', true),
((select id from products where name = 'Ariana Grande R.E.M. EDP'), '100ml', 1450, 'completo', true),
((select id from products where name = 'Ariana Grande Sweet Like Candy EDP'), '100ml', 1350, 'completo', true),

((select id from products where name = 'Art of Universe EDP'), '100ml', 1300, 'completo', true),
((select id from products where name = 'Atlantis EDP'), '100ml', 1450, 'completo', true),
((select id from products where name = 'Atlas EDP'), '55ml', 1150, 'completo', true),

((select id from products where name = 'The Most Wanted Parfum'), '100ml', 2300, 'completo', true),
((select id from products where name = 'The Most Wanted EDP Intense'), '100ml', 1950, 'completo', true),

((select id from products where name = 'Bad Boy Cobalt Elixir EDP'), '100ml', 2450, 'completo', true),
((select id from products where name = 'Bad Boy Cobalt EDT'), '100ml', 2100, 'completo', true),
((select id from products where name = 'Bad Boy EDT'), '100ml', 2250, 'completo', true),
((select id from products where name = 'Bad Boy Elixir'), '100ml', 2350, 'completo', true),
((select id from products where name = 'Bad Boy Extreme EDP'), '100ml', 2450, 'completo', true),
((select id from products where name = 'Bad Boy Le Parfum EDP'), '100ml', 2350, 'completo', true),

((select id from products where name = 'Bharara King EDP'), '100ml', 1550, 'completo', true);

-- ============================================
-- LOTE 3
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Black Opium EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Bleu de Chanel Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'chanel'), true),

('Queens EDP', null, null, 'mujer',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'bond-no-9'), true),

('Tribeca EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'bond-no-9'), true),

('Boss Bottled Citrus EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'hugo-boss'), true),

('Boss Bottled Night EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'hugo-boss'), true),

('Boss Bottled Tonic EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'hugo-boss'), true),

('Boss The Scent EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'hugo-boss'), true),

('Burberry Her EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'burberry'), true),

('Burberry Her Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'burberry'), true),

('Burberry Her Garden Party EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'burberry'), true),

('Burberry Her London Dream EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'burberry'), true),

('Burberry London EDP', null, null, 'unisex',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'burberry'), true),

('Man In Black EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'bvlgari'), true),

('212 Heroes Forever EDP', null, null, 'unisex',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('212 Sexy Woman EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('212 VIP NYC EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('212 VIP Rosé Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('212 Woman EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('CH Pasión EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('CH Woman', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Black Opium EDT'), '90ml', 2800, 'completo', true),
((select id from products where name = 'Bleu de Chanel Parfum'), '100ml', 4250, 'completo', true),
((select id from products where name = 'Queens EDP'), '100ml', 4500, 'completo', true),
((select id from products where name = 'Tribeca EDP'), '100ml', 6200, 'completo', true),

((select id from products where name = 'Boss Bottled Citrus EDP'), '100ml', 1800, 'completo', true),
((select id from products where name = 'Boss Bottled Night EDT'), '100ml', 1200, 'completo', true),
((select id from products where name = 'Boss Bottled Tonic EDT'), '100ml', 1400, 'completo', true),
((select id from products where name = 'Boss The Scent EDT'), '100ml', 1550, 'completo', true),

((select id from products where name = 'Burberry Her EDP'), '100ml', 2590, 'completo', true),
((select id from products where name = 'Burberry Her Elixir EDP'), '100ml', 2850, 'completo', true),
((select id from products where name = 'Burberry Her Garden Party EDT'), '100ml', 1950, 'completo', true),
((select id from products where name = 'Burberry Her London Dream EDP'), '100ml', 1999, 'completo', true),
((select id from products where name = 'Burberry London EDP'), '100ml', 1290, 'completo', true),

((select id from products where name = 'Man In Black EDP'), '100ml', 2450, 'completo', true),

((select id from products where name = '212 Heroes Forever EDP'), '90ml', 1750, 'completo', true),
((select id from products where name = '212 Sexy Woman EDP'), '100ml', 1750, 'completo', true),
((select id from products where name = '212 VIP NYC EDP'), '80ml', 1950, 'completo', true),
((select id from products where name = '212 VIP Rosé Elixir EDP'), '80ml', 2250, 'completo', true),
((select id from products where name = '212 Woman EDP'), '125ml', 2260, 'completo', true),
((select id from products where name = 'CH Pasión EDP'), '100ml', 1350, 'completo', true);
-- Nota: 'CH Woman' no traía tamaño ni precio en el listado original —
-- falta su variante, agrégala cuando tengas ese dato.

-- ============================================
-- LOTE 4
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Good Girl EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Good Girl Blush EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Good Girl Blush Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('La Bomba EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Very Good Girl EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Very Good Girl Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('La Panthère Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'cartier'), true),

('CH EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'carolina-herrera'), true),

('Chance EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'chanel'), true),

('Chaos EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'french-avenue'), true),

('Cocoa Morado EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'french-avenue'), true),

('Devotion EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dolce-gabbana'), true),

('Light Blue Intense EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dolce-gabbana'), true),

('Light Blue Intense EDP Mujer', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dolce-gabbana'), true),

('The Only One EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dolce-gabbana'), true),

('Homme Cologne', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Homme Intense EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Homme EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Homme Sport', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Divine EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'ryhaan'), true),

('Devotion Intense EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dolce-gabbana'), true),

('N°2 EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'elish'), true),

('Fakhar EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('Fakhar EDP Mujer', null, null, 'mujer',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('Fame Feline EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Fame EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Gabrielle L''Eau EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'chanel'), true),

('All In Parfum', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'game-of-spades'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Good Girl EDP'), '80ml', 2499, 'completo', true),
((select id from products where name = 'Good Girl Blush EDP'), '80ml', 2499, 'completo', true),
((select id from products where name = 'Good Girl Blush Elixir EDP'), '80ml', 2650, 'completo', true),
((select id from products where name = 'La Bomba EDP'), '80ml', 3190, 'completo', true),
((select id from products where name = 'Very Good Girl EDP'), '80ml', 2490, 'completo', true),
((select id from products where name = 'Very Good Girl Elixir EDP'), '80ml', 2600, 'completo', true),

((select id from products where name = 'La Panthère Elixir EDP'), '100ml', 2590, 'completo', true),

((select id from products where name = 'CH EDT'), '100ml', 1999, 'completo', true),

((select id from products where name = 'Chance EDP'), '100ml', 4300, 'completo', true),

((select id from products where name = 'Chaos EDP'), '100ml', 1400, 'completo', true),
((select id from products where name = 'Cocoa Morado EDP'), '100ml', 1490, 'completo', true),

((select id from products where name = 'Devotion EDP'), '100ml', 2050, 'completo', true),
((select id from products where name = 'Light Blue Intense EDP'), '100ml', 2100, 'completo', true),
((select id from products where name = 'Light Blue Intense EDP Mujer'), '100ml', 1690, 'completo', true),
((select id from products where name = 'The Only One EDP'), '100ml', 2199, 'completo', true),

((select id from products where name = 'Homme Cologne'), '125ml', 2500, 'completo', true),
((select id from products where name = 'Homme Intense EDP'), '100ml', 2850, 'completo', true),
((select id from products where name = 'Homme EDT'), '100ml', 2400, 'completo', true),
((select id from products where name = 'Homme Sport'), '125ml', 2550, 'completo', true),

((select id from products where name = 'Divine EDP'), '100ml', 1450, 'completo', true),
((select id from products where name = 'Devotion Intense EDP'), '100ml', 2500, 'completo', true),
((select id from products where name = 'N°2 EDP'), '100ml', 1490, 'completo', true),

((select id from products where name = 'Fakhar EDP'), '100ml', 900, 'completo', true),
((select id from products where name = 'Fakhar EDP Mujer'), '100ml', 999, 'completo', true),

((select id from products where name = 'Fame Feline EDP'), '100ml', 2650, 'completo', true),
((select id from products where name = 'Fame EDP'), '80ml', 2390, 'completo', true),

((select id from products where name = 'Gabrielle L''Eau EDT'), '100ml', 3999, 'completo', true),

((select id from products where name = 'All In Parfum'), '100ml', 2050, 'completo', true);

-- ============================================
-- LOTE 5
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Bonus EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'game-of-spades'), true),

('Double Bonus Parfum', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'game-of-spades'), true),

('Full House EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'game-of-spades'), true),

('No Limit Parfum', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'game-of-spades'), true),

('Wildcard EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'game-of-spades'), true),

('Halloween Man EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'halloween'), true),

('Halloween Man X EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'halloween'), true),

('Hawas Atlantis EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Black EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Diva EDP', null, null, 'mujer',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Eclat EDP', null, null, 'mujer',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Elixir EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Fire EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas For Him EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Ice EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Kobra EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Malibú EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Pink EDP', null, null, 'mujer',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Tropical EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Hawas Verde EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'rasasi'), true),

('Her Confession EDP', null, null, 'mujer',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'zimaya'), true),

('His Confession EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'zimaya'), true),

('Invictus Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Invictus Victory', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Invictus EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Invictus Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Invictus Victory Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Bonus EDP'), '100ml', 2050, 'completo', true),
((select id from products where name = 'Double Bonus Parfum'), '100ml', 1950, 'completo', true),
((select id from products where name = 'Full House EDP'), '100ml', 1950, 'completo', true),
((select id from products where name = 'No Limit Parfum'), '100ml', 1900, 'completo', true),
((select id from products where name = 'Wildcard EDP'), '100ml', 1750, 'completo', true),

((select id from products where name = 'Halloween Man EDT'), '125ml', 1150, 'completo', true),
((select id from products where name = 'Halloween Man X EDT'), '125ml', 1150, 'completo', true),

((select id from products where name = 'Hawas Atlantis EDP'), '100ml', 1400, 'completo', true),
((select id from products where name = 'Hawas Black EDP'), '100ml', 950, 'completo', true),
((select id from products where name = 'Hawas Diva EDP'), '100ml', 1499, 'completo', true),
((select id from products where name = 'Hawas Eclat EDP'), '100ml', 1499, 'completo', true),
((select id from products where name = 'Hawas Elixir EDP'), '100ml', 1200, 'completo', true),
((select id from products where name = 'Hawas Fire EDP'), '100ml', 1400, 'completo', true),
((select id from products where name = 'Hawas For Him EDP'), '100ml', 1100, 'completo', true),
((select id from products where name = 'Hawas Ice EDP'), '100ml', 1350, 'completo', true),
((select id from products where name = 'Hawas Kobra EDP'), '100ml', 1350, 'completo', true),
((select id from products where name = 'Hawas Malibú EDP'), '100ml', 1350, 'completo', true),
((select id from products where name = 'Hawas Pink EDP'), '100ml', 1499, 'completo', true),
((select id from products where name = 'Hawas Tropical EDP'), '100ml', 1400, 'completo', true),
((select id from products where name = 'Hawas Verde EDP'), '100ml', 1400, 'completo', true),

((select id from products where name = 'Her Confession EDP'), '100ml', 1499, 'completo', true),
((select id from products where name = 'His Confession EDP'), '100ml', 1300, 'completo', true),

((select id from products where name = 'Invictus Parfum'), '100ml', 2300, 'completo', true),
((select id from products where name = 'Invictus Victory'), '100ml', 2300, 'completo', true),
((select id from products where name = 'Invictus EDT'), '100ml', 1850, 'completo', true),
((select id from products where name = 'Invictus EDT'), '200ml', 2400, 'completo', true),
((select id from products where name = 'Invictus Elixir'), '100ml', 2700, 'completo', true),
((select id from products where name = 'Invictus Victory Elixir'), '100ml', 2300, 'completo', true);

-- ============================================
-- LOTE 6
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Irresistible EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'givenchy'), true),

('Divine EDP JPG', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Divine Elixir Parfum', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Khamrah EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('Khamrah Qahwa EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'lattafa'), true),

('La Nuit Trésor EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('La Vie Est Belle EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'lancome'), true),

('La Vie Est Belle Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'lancome'), true),

('Le Beau EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Le Beau Le Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Le Beau Narcisse', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Le Beau Paradise Garden', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Le Male Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Le Male Le Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Le Male Elixir Absolu', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Libre Absolu Platine EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Libre Intense EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Libre L''Eau Nue Parfum', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Libre EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Miss Dior EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Miss Dior Blooming Bouquet EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Mon Guerlain EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'guerlain'), true),

('Arabians Tonka EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'montale'), true),

('Explorer Extreme EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'montblanc'), true),

('Explorer EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'montblanc'), true),

('Legend', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'montblanc'), true),

('Legend EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'montblanc'), true),

('Xplorer Platinum EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'montblanc'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Irresistible EDP'), '80ml', 2490, 'completo', true),

((select id from products where name = 'Divine EDP JPG'), '100ml', 2590, 'completo', true),
((select id from products where name = 'Divine Elixir Parfum'), '100ml', 3100, 'completo', true),

((select id from products where name = 'Khamrah EDP'), '100ml', 1100, 'completo', true),
((select id from products where name = 'Khamrah Qahwa EDP'), '100ml', 999, 'completo', true),

((select id from products where name = 'La Nuit Trésor EDP'), '100ml', 2490, 'completo', true),

((select id from products where name = 'La Vie Est Belle EDP'), '100ml', 2490, 'completo', true),
((select id from products where name = 'La Vie Est Belle Elixir EDP'), '100ml', 2999, 'completo', true),

((select id from products where name = 'Le Beau EDT'), '125ml', 2200, 'completo', true),
((select id from products where name = 'Le Beau Le Parfum'), '125ml', 2500, 'completo', true),
((select id from products where name = 'Le Beau Narcisse'), '125ml', 2700, 'completo', true),
((select id from products where name = 'Le Beau Paradise Garden'), '125ml', 2200, 'completo', true),

((select id from products where name = 'Le Male Elixir'), '125ml', 2500, 'completo', true),
((select id from products where name = 'Le Male Le Parfum'), '125ml', 2750, 'completo', true),
((select id from products where name = 'Le Male Elixir Absolu'), '125ml', 2800, 'completo', true),

((select id from products where name = 'Libre Absolu Platine EDP'), '90ml', 3299, 'completo', true),
((select id from products where name = 'Libre Intense EDP'), '90ml', 3199, 'completo', true),
((select id from products where name = 'Libre L''Eau Nue Parfum'), '90ml', 2650, 'completo', true),
((select id from products where name = 'Libre EDP'), '90ml', 2999, 'completo', true),

((select id from products where name = 'Miss Dior EDP'), '100ml', 3199, 'completo', true),
((select id from products where name = 'Miss Dior Blooming Bouquet EDT'), '100ml', 2799, 'completo', true),

((select id from products where name = 'Mon Guerlain EDP'), '100ml', 2450, 'completo', true),

((select id from products where name = 'Arabians Tonka EDP'), '100ml', 2650, 'completo', true),

((select id from products where name = 'Explorer Extreme EDP'), '100ml', 2600, 'completo', true),
((select id from products where name = 'Explorer EDP'), '100ml', 1450, 'completo', true),
((select id from products where name = 'Legend'), '100ml', 1400, 'completo', true),
((select id from products where name = 'Legend EDT'), '100ml', 1300, 'completo', true),
((select id from products where name = 'Xplorer Platinum EDP'), '100ml', 1550, 'completo', true);

-- ============================================
-- LOTE 7
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Toy 2 EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'moschino'), true),

('Toy 2 Bubblegum EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'moschino'), true),

('Toy 2 Pearl EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'moschino'), true),

('Angel Nova EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'mugler'), true),

('Odyssey Aristo EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Odyssey Aqua EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Odyssey Bahamas EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Odyssey Homme EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Odyssey Mandarín Sky EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Odyssey Mega EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Odyssey Spectra EDP', null, null, 'hombre',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'odyssey'), true),

('Olympea EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Olympea Flora EDP Intense', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Olympea Parfum', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Phantom EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Phantom Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Phantom Intense', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('Phantom Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'paco-rabanne'), true),

('L''Homme EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'prada'), true),

('Paradigme EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'prada'), true),

('Paradoxe EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'prada'), true),

('Paradoxe Intense EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'prada'), true),

('Paradoxe Radical Essence Parfum', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'prada'), true),

('Rayhaan Italia EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'ryhaan'), true),

('Rayhaan Elixir EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'ryhaan'), true),

('Rayhaan Jungle Vibe EDP', null, null, 'unisex',
 (select id from categories where slug = 'arabe'),
 (select id from brands where slug = 'ryhaan'), true),

('Sauvage EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Toy 2 EDP'), '100ml', 1500, 'completo', true),
((select id from products where name = 'Toy 2 Bubblegum EDP'), '100ml', 1600, 'completo', true),
((select id from products where name = 'Toy 2 Pearl EDP'), '100ml', 1500, 'completo', true),

((select id from products where name = 'Angel Nova EDP'), '100ml', 2399, 'completo', true),

((select id from products where name = 'Odyssey Aristo EDP'), '100ml', 990, 'completo', true),
((select id from products where name = 'Odyssey Aqua EDP'), '100ml', 1100, 'completo', true),
((select id from products where name = 'Odyssey Bahamas EDP'), '100ml', 1200, 'completo', true),
((select id from products where name = 'Odyssey Homme EDP'), '100ml', 999, 'completo', true),
((select id from products where name = 'Odyssey Mandarín Sky EDP'), '100ml', 800, 'completo', true),
((select id from products where name = 'Odyssey Mega EDP'), '100ml', 800, 'completo', true),
((select id from products where name = 'Odyssey Mega EDP'), '200ml', 1500, 'completo', true),
((select id from products where name = 'Odyssey Spectra EDP'), '100ml', 999, 'completo', true),

((select id from products where name = 'Olympea EDP'), '80ml', 1900, 'completo', true),
((select id from products where name = 'Olympea Flora EDP Intense'), '80ml', 1650, 'completo', true),
((select id from products where name = 'Olympea Parfum'), '80ml', 2350, 'completo', true),

((select id from products where name = 'Phantom EDT'), '100ml', 1950, 'completo', true),
((select id from products where name = 'Phantom Elixir'), '100ml', 2300, 'completo', true),
((select id from products where name = 'Phantom Intense'), '100ml', 2200, 'completo', true),
((select id from products where name = 'Phantom Parfum'), '100ml', 2350, 'completo', true),

((select id from products where name = 'L''Homme EDT'), '100ml', 2200, 'completo', true),
((select id from products where name = 'Paradigme EDP'), '100ml', 2850, 'completo', true),
((select id from products where name = 'Paradoxe EDP'), '90ml', 2900, 'completo', true),
((select id from products where name = 'Paradoxe Intense EDP'), '90ml', 3200, 'completo', true),
((select id from products where name = 'Paradoxe Radical Essence Parfum'), '90ml', 3099, 'completo', true),

((select id from products where name = 'Rayhaan Italia EDP'), '100ml', 1200, 'completo', true),
((select id from products where name = 'Rayhaan Elixir EDP'), '100ml', 1150, 'completo', true),
((select id from products where name = 'Rayhaan Jungle Vibe EDP'), '100ml', 1250, 'completo', true),

((select id from products where name = 'Sauvage EDP'), '100ml', 3100, 'completo', true);

-- ============================================
-- LOTE 8
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Sauvage EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Sauvage Elixir', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Sauvage Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'dior'), true),

('Scandal Absolu EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Scandal EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Scandal Intense EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Scandal Le Parfum EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'jean-paul-gaultier'), true),

('Spicebomb Night Vision EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'viktor-rolf'), true),

('Spicebomb Dark Leather EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'viktor-rolf'), true),

('Spicebomb EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'viktor-rolf'), true),

('Spicebomb Extreme', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'viktor-rolf'), true),

('Spicebomb Infrared EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'viktor-rolf'), true),

('Tous Emerald Elixir EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'tous'), true),

('Tous Love Me EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'tous'), true),

('Tous Love Me Silver Parfum', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'tous'), true),

('Tous Love The Onyx EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'tous'), true),

('Born In Roma Coral Fantasy EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Extradose EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Green Stravaganza EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Intense EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Sauvage EDT'), '100ml', 2900, 'completo', true),
((select id from products where name = 'Sauvage Elixir'), '60ml', 3450, 'completo', true),
((select id from products where name = 'Sauvage Parfum'), '100ml', 3300, 'completo', true),

((select id from products where name = 'Scandal Absolu EDP'), '100ml', 2200, 'completo', true),
((select id from products where name = 'Scandal EDT'), '100ml', 2200, 'completo', true),
((select id from products where name = 'Scandal Intense EDP'), '100ml', 2100, 'completo', true),
((select id from products where name = 'Scandal Le Parfum EDP'), '100ml', 2400, 'completo', true),

((select id from products where name = 'Spicebomb Night Vision EDP'), '90ml', 2500, 'completo', true),
((select id from products where name = 'Spicebomb Dark Leather EDP'), '90ml', 2600, 'completo', true),
((select id from products where name = 'Spicebomb EDT'), '100ml', 2100, 'completo', true),
((select id from products where name = 'Spicebomb Extreme'), '90ml', 2300, 'completo', true),
((select id from products where name = 'Spicebomb Infrared EDP'), '100ml', 2750, 'completo', true),

((select id from products where name = 'Tous Emerald Elixir EDP'), '90ml', 1850, 'completo', true),
((select id from products where name = 'Tous Love Me EDP'), '90ml', 1599, 'completo', true),
((select id from products where name = 'Tous Love Me Silver Parfum'), '90ml', 1550, 'completo', true),
((select id from products where name = 'Tous Love The Onyx EDP'), '90ml', 1699, 'completo', true),

((select id from products where name = 'Born In Roma Coral Fantasy EDP'), '100ml', 2500, 'completo', true),
((select id from products where name = 'Born In Roma EDT'), '100ml', 2500, 'completo', true),
((select id from products where name = 'Born In Roma Extradose EDP'), '100ml', 3300, 'completo', true),
((select id from products where name = 'Born In Roma Green Stravaganza EDP'), '100ml', 2500, 'completo', true),
((select id from products where name = 'Born In Roma Intense EDP'), '100ml', 3300, 'completo', true);

-- ============================================
-- LOTE 9
-- ============================================

-- ---------- Productos ----------
insert into products (name, description, image_url, gender, category_id, brand_id, is_active) values

('Born In Roma Purple Melancholia EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Purple Melancholia EDP (Donna)', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma EDP (Donna)', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Coral Fantasy EDP (Donna)', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Extradose EDP (Donna)', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Born In Roma Intense EDP (Donna)', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'valentino'), true),

('Eros Flame EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Bright Crystal EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Bright Crystal Absolu EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Dylan Blue EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Dylan Blue Set', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Eros EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Eros Energy EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Eros Najim Parfum', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Pour Femme EDP', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Pour Homme EDT', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Yellow Diamond EDT', null, null, 'mujer',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'versace'), true),

('Erba Gold EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'xerjoff'), true),

('Erba Pura EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'xerjoff'), true),

('Naxos EDP', null, null, 'hombre',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'xerjoff'), true),

('Torino 21 EDP', null, null, 'unisex',
 (select id from categories where slug = 'nicho'),
 (select id from brands where slug = 'xerjoff'), true),

('Myslf EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true),

('Myslf L''Absolu EDP', null, null, 'hombre',
 (select id from categories where slug = 'disenador'),
 (select id from brands where slug = 'ysl'), true);

-- ---------- Variantes ----------
insert into variants (product_id, size_label, price, type, available) values

((select id from products where name = 'Born In Roma Purple Melancholia EDP'), '100ml', 3200, 'completo', true),
((select id from products where name = 'Born In Roma Purple Melancholia EDP (Donna)'), '100ml', 3500, 'completo', true),
((select id from products where name = 'Born In Roma EDP (Donna)'), '100ml', 2999, 'completo', true),
((select id from products where name = 'Born In Roma Coral Fantasy EDP (Donna)'), '100ml', 2800, 'completo', true),
((select id from products where name = 'Born In Roma Extradose EDP (Donna)'), '100ml', 3200, 'completo', true),
((select id from products where name = 'Born In Roma Intense EDP (Donna)'), '100ml', 3200, 'completo', true),

((select id from products where name = 'Eros Flame EDP'), '200ml', 2300, 'completo', true),
((select id from products where name = 'Bright Crystal EDT'), '200ml', 2190, 'completo', true),
((select id from products where name = 'Bright Crystal Absolu EDP'), '90ml', 1890, 'completo', true),
((select id from products where name = 'Dylan Blue EDT'), '100ml', 1600, 'completo', true),
((select id from products where name = 'Dylan Blue Set'), '100ml', 2200, 'completo', true),
((select id from products where name = 'Eros EDP'), '100ml', 1750, 'completo', true),
((select id from products where name = 'Eros Energy EDP'), '100ml', 1999, 'completo', true),
((select id from products where name = 'Eros Najim Parfum'), '100ml', 2300, 'completo', true),
((select id from products where name = 'Pour Femme EDP'), '100ml', 1990, 'completo', true),
((select id from products where name = 'Pour Homme EDT'), '100ml', 1500, 'completo', true),
((select id from products where name = 'Yellow Diamond EDT'), '90ml', 1699, 'completo', true),

((select id from products where name = 'Erba Gold EDP'), '100ml', 4500, 'completo', true),
((select id from products where name = 'Erba Pura EDP'), '100ml', 4500, 'completo', true),
((select id from products where name = 'Naxos EDP'), '100ml', 4400, 'completo', true),
((select id from products where name = 'Torino 21 EDP'), '100ml', 5000, 'completo', true),

((select id from products where name = 'Myslf EDP'), '100ml', 2700, 'completo', true),
((select id from products where name = 'Myslf L''Absolu EDP'), '100ml', 3300, 'completo', true);
