# [ENTREGABLE] — Fase 3: Sistema de Diseño y Wireframes — AegonPerfumes

## Estado de la fase

Sistema de diseño en código (`design-system.css`) completo y en uso real en el Home
(`home.html`), ya desplegado en GitHub Pages para validación con el cliente. Este
documento cierra la fase formalmente, describiendo las páginas restantes del sitemap
que todavía no tienen HTML — su estructura queda definida aquí para construirse
directamente en Fase 5, sin ambigüedad.

---

## 1. Flujo de usuario principal

```
Home → Catálogo → (selección inline en tarjeta) → Carrito → Checkout → MercadoPago → Confirmación
```

No existe una página de "ficha de producto" separada — decisión tomada en Fase 2:
la tarjeta de catálogo ES la unidad completa de compra. Esto simplifica el flujo a
5 pantallas reales en vez de 6.

---

## 2. Componentes ya definidos (reutilizados en todas las páginas de abajo)

| Componente | Clase CSS | Usado en |
|---|---|---|
| Navbar | `.navbar` | Todas las páginas |
| Botón primario/secundario | `.btn-primary` / `.btn-secondary` | Todas |
| Tarjeta de producto | `.product-card` | Home, Catálogo |
| Grid de productos | `.product-grid` | Home, Catálogo |
| Badge (decant/original/bestseller) | `.badge` | Home, Catálogo |
| Selector de variante | `.variant-selector` / `.variant-pill` | Home, Catálogo |
| Carrito lateral | `.cart-panel` / `.cart-item` | Todas (overlay) |
| Campo de formulario | `.form-field` | Checkout |
| Status pill | `.status-pill` | Panel admin (Fase 5, bloque 9) |
| Botón flotante WhatsApp | `.whatsapp-float` | Todas |

Ningún componente nuevo definido abajo introduce un color, tipografía o espaciado
fuera de las variables ya declaradas en `:root`.

---

## 3. Página: Catálogo

**Objetivo:** que el usuario encuentre su fragancia en menos de 3 filtros/scrolls.

**Estructura (mobile-first):**

```
┌─────────────────────────────┐
│ Navbar (sticky)              │
├─────────────────────────────┤
│ Barra de filtros (sticky)    │
│ [Categoría ▾] [Marca ▾]      │
│ [Decant/Original ▾] [Precio]│
├─────────────────────────────┤
│ Contador: "42 productos"     │
├─────────────────────────────┤
│ .product-grid (2 columnas    │
│  en móvil, usando el mismo   │
│  .product-card del Home)     │
│                               │
│  [card] [card]                │
│  [card] [card]                │
│  ...                          │
├─────────────────────────────┤
│ Paginación o scroll infinito │
│ (decisión pendiente Fase 5)  │
├─────────────────────────────┤
│ Footer                        │
└─────────────────────────────┘
```

**[DECISIÓN pendiente para Fase 5]** — paginación clásica vs. scroll infinito. Con
~100 productos, ambas opciones son viables; scroll infinito es más natural en móvil
pero paginación es más simple de implementar sin librerías. Lo definimos al construir
este bloque.

**Nuevo elemento necesario:** `.filter-bar` — no existe todavía en el sistema de
diseño. Se agrega en Fase 5 cuando se construya esta página, siguiendo el mismo
patrón de tokens (fondo `--color-surface`, borde `--color-border`).

---

## 4. "Ficha de producto" (comportamiento inline, no página)

Recordatorio de la decisión de Fase 2: no hay ruta ni página dedicada. Lo que en
otros e-commerce sería una ficha de producto, aquí es la **interacción dentro de
la misma tarjeta**:

```
┌───────────────────┐
│                     │
│   [imagen 1:1]      │
│                     │
├───────────────────┤
│ MARCA (secundario)  │
│ Nombre del producto  │
│ [Decant] [Bestseller]│
│ (3ml)(5ml)(10ml)(30ml)│ ← variant-selector, toca para cambiar precio
│ $450 MXN             │
│ [Agregar al carrito] │
└───────────────────┘
```

Al tocar una variante (`.variant-pill`), el precio (`.product-card__price`) se
actualiza en el momento — sin recargar página, sin navegar. Esto se implementa con
JS vanilla en Fase 5 (Bloque 5), pero el HTML/CSS ya está listo desde el Home.

**[ALERTA] Riesgo aceptado, ya documentado en Fase 2:** sin ficha de producto, no hay
espacio para descripción larga de notas olfativas, imágenes múltiples, o reseñas.
Si el dueño detecta que los clientes preguntan mucho por WhatsApp antes de comprar
("¿a qué huele?", "¿cuánto dura?"), es la señal de que hace falta la ficha en V2.

---

## 5. Página/Panel: Carrito

**Ya prototipado visualmente en la Fase 3 inicial** (`.cart-panel`). Se abre como
panel lateral sobre overlay, no como página independiente — mantiene al usuario
en el contexto de compra sin perder su lugar en el catálogo.

```
┌─────────────────────────────┐
│ overlay oscuro (.cart-overlay)│
│         ┌───────────────────┤
│         │ Tu carrito      [×]│
│         ├───────────────────┤
│         │ [img] Producto A    │
│         │       5ml · Cant: 1 │
│         │                $450 │
│         ├───────────────────┤
│         │ [img] Producto B    │
│         │       10ml · Cant: 2│
│         │                $760 │
│         ├───────────────────┤
│         │ Total       $1,210  │
│         │ [Ir a pagar]         │
│         └───────────────────┘
└─────────────────────────────┘
```

**Estado vacío (nuevo, a definir en Fase 5):** mensaje breve + botón "Explorar
catálogo". No se ha diseñado el copy todavía — pendiente.

**[DECISIÓN pendiente]** — persistencia del carrito: `localStorage` (sobrevive si
el usuario cierra el navegador) vs. estado en memoria (se pierde al recargar). Para
un negocio donde el cliente puede tardar en decidir, `localStorage` es probablemente
la opción correcta — se confirma en Fase 5, Bloque 6.

---

## 6. Página: Checkout

```
┌─────────────────────────────┐
│ Navbar                       │
├─────────────────────────────┤
│ Datos de contacto             │
│ [Nombre completo]  .form-field│
│ [Teléfono]                    │
├─────────────────────────────┤
│ Tipo de entrega                │
│ ( ) Recoger en local            │
│ ( ) Paquetería                  │
│  → si "Paquetería": aparece      │
│    [Dirección completa]          │
├─────────────────────────────┤
│ Resumen del pedido               │
│ Producto A · 5ml       $450      │
│ Producto B · 10ml x2   $760      │
│ Total                 $1,210      │
├─────────────────────────────┤
│ [Pagar con MercadoPago]  ← .btn-primary│
└─────────────────────────────┘
```

El campo de dirección se muestra/oculta según `orders.delivery_type` (definido en
el modelo de datos de Fase 2) — comportamiento condicional simple con JS, sin
recargar la página.

---

## 7. Página: Confirmación de pedido

```
┌─────────────────────────────┐
│         ✓ (ícono grande,      │
│      color --color-accent)    │
│                                 │
│   ¡Pedido recibido!            │
│   Folio: #A0231                 │
├─────────────────────────────┤
│ Resumen del pedido (igual que  │
│ en checkout, ya confirmado)     │
├─────────────────────────────┤
│ [Confirmar por WhatsApp]        │
│  ← .btn-primary, grande,        │
│  lleva el link wa.me con el     │
│  resumen pre-escrito             │
├─────────────────────────────┤
│ [Volver al catálogo]            │
│  ← .btn-secondary                │
└─────────────────────────────┘
```

Esta página es la única con un botón de WhatsApp **contextual** (con el resumen
del pedido ya armado en el mensaje) — distinto al botón flotante genérico que
existe en todo el sitio para dudas previas a la compra.

---

## Mejoras de rendimiento y móvil aplicadas en esta fase

Aprovechando el cierre formal, se corrigieron 3 puntos de deuda técnica detectados
al revisar el Home ya desplegado:

- **Carga diferida de imágenes real:** se reemplazó `background-image` (CSS) por
  `<img loading="lazy">` en tarjetas de producto, categorías e Instagram. Con un
  catálogo de ~100 productos en Fase 5, esto evita que el navegador descargue
  fotos que el usuario no ha scrolleado todavía.
- **Imágenes más ligeras:** se redujo la calidad de compresión solicitada a
  Unsplash (`q=70` en vez de `q=80`) y se agregó `&auto=format` para que el
  servidor entregue WebP/AVIF cuando el navegador lo soporta — mismo resultado
  visual, archivo más pequeño.
- **Catálogo en 2 columnas fijas en móvil:** antes, en pantallas angostas el grid
  podía colapsar a 1 columna con tarjetas gigantes. Ahora fuerza 2 columnas desde
  560px hacia abajo, como se espera de un catálogo de e-commerce en celular.
- **Título del hero con escalado fluido (`clamp()`):** evita que el texto se vea
  apretado en pantallas de 320-360px sin perder impacto en desktop.
- **[ALERTA corregida] Bug de link roto:** el botón "Escríbenos por WhatsApp" del
  footer apuntaba a `href="#"` (no hacía nada). Ya corregido, apunta al mismo link
  `wa.me` que el botón flotante.

---

## MINI-RETROSPECTIVA DE FASE 3 (cierre)

**Qué decidimos:**
- Sistema de diseño completo en `design-system.css`: paleta, tipografía
  (Cormorant Garamond + Inter), espaciado, componentes transaccionales y de
  contenido (navbar, hero, value props, WhatsApp flotante, Instagram, footer)
- Home construido y validado en producción (GitHub Pages)
- Wireframes documentados para Catálogo, comportamiento inline de "ficha de
  producto", Carrito, Checkout y Confirmación
- Corrección de rendimiento de imágenes y ajustes de móvil aplicados sobre
  código ya desplegado, no solo en teoría

**Qué queda pendiente para decidir en Fase 5 (no bloquea el cierre de Fase 3):**
- Paginación vs. scroll infinito en Catálogo
- Persistencia del carrito (`localStorage` vs. memoria)
- Copy del estado vacío del carrito
- Estructura final de `.filter-bar` (no existe todavía como componente)

**Por qué importa:**
Cerrar Fase 3 con estos wireframes documentados significa que Fase 5 (desarrollo
por bloques) no empieza en blanco — cada bloque ya tiene su estructura y sus
componentes resueltos de antemano. Lo único que queda es conectarlos a datos
reales de Supabase.

**Qué viene después:**
Fase 4 — configurar el proyecto real en Supabase: crear las tablas del modelo de
Fase 2, políticas RLS, y cargar 10-15 productos de prueba (con fotos reales del
dueño, no más stock de Unsplash) para empezar a conectar el frontend con datos
reales.