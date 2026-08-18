-- Restringe la lectura pública de variants a columnas que no revelan
-- inventario exacto. Hasta ahora la protección de "no exponer stock al
-- catálogo público" vivía solo en el código JS (catalogSearch.js con
-- incluirStock: false) — eso es una convención de aplicación, no una
-- regla de seguridad real. Cualquiera con la clave anon podía pedir
-- variants.stock directamente, sin pasar por el catálogo.
--
-- Este privilegio de columna es independiente de RLS: RLS decide qué
-- FILAS puede ver un rol, esto decide qué COLUMNAS de esas filas.
revoke select on variants from anon;

grant select (
  id,
  product_id,
  size_label,
  price,
  discount_percentage,
  available,
  type
) on variants to anon;

-- authenticated (panel admin) conserva acceso a todas las columnas,
-- incluyendo stock, sin cambios.