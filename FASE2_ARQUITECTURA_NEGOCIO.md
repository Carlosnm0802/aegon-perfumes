# Fase 2 — Arquitectura de información y planificación técnica
## AegonPerfumes

---

## 1. Sitemap

**7 páginas — flujo de compra lineal**

```
Home
└── Catálogo (filtros · variantes · agregar al carrito)
    └── Carrito (resumen · cantidades · total)
        └── Checkout (datos · entrega · pago MercadoPago)
            └── MercadoPago (externo)
                └── Confirmación de pedido (resumen · link WhatsApp)

Home ──(acceso admin)──> Panel Admin (protegido con Supabase Auth)
```

### Descripción de páginas

| Página | Ruta | Descripción |
|---|---|---|
| Home | `/` | Hero, productos destacados, acceso rápido al catálogo |
| Catálogo | `/catalogo` | Listado completo con filtros. Tarjeta incluye selector de variante y botón de carrito |
| Carrito | `/carrito` | Resumen de productos seleccionados, cantidades y total |
| Checkout | `/checkout` | Datos del cliente, tipo de entrega (local / paquetería), botón de pago |
| MercadoPago | externo | Flujo de pago gestionado por MercadoPago. Redirige de vuelta al confirmar |
| Confirmación | `/confirmacion` | Resumen del pedido confirmado + link `wa.me` generado automáticamente |
| Panel Admin | `/admin` | Gestión de productos, variantes, stock y pedidos. Protegido con Supabase Auth |

### Decisiones de sitemap

- **Sin página de detalle de producto en V1.** La tarjeta del catálogo es la unidad completa de compra: muestra información, selector de variante y botón de carrito. Se agrega en V2 si el dueño detecta que los clientes piden más información antes de comprar.
- El flujo es estrictamente lineal: catálogo → carrito → checkout → pago → confirmación. No hay rutas alternativas en el MVP.

---

## 2. Modelo de datos — Supabase (PostgreSQL)

### Diagrama de entidades

```
categories          brands
    |                  |
    └──────┬───────────┘
           │
        products
       (type: decant | original)
       (is_active: boolean)
           │
        variants
       (size_label, price, available)
           │
      order_items ──── orders
       (unit_price)     (status, delivery_type)
```

### Tablas

#### `categories`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `name` | `text` | Nombre de la categoría (ej. "Árabe", "Diseñador", "Nicho") |
| `slug` | `text` | Versión URL-friendly del nombre |

#### `brands`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `name` | `text` | Nombre de la marca |
| `slug` | `text` | Versión URL-friendly del nombre |

#### `products`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `name` | `text` | Nombre del perfume |
| `description` | `text` | Descripción, notas olfativas, ocasión |
| `image_url` | `text` | URL de imagen en Supabase Storage |
| `type` | `text` | `"decant"` o `"original"` |
| `category_id` | `uuid` FK → `categories` | Categoría del perfume |
| `brand_id` | `uuid` FK → `brands` | Marca del perfume |
| `is_active` | `boolean` | Permite ocultar sin borrar el registro |
| `created_at` | `timestamp` | Fecha de creación |

#### `variants`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `product_id` | `uuid` FK → `products` | Producto al que pertenece |
| `size_label` | `text` | Ej. `"5ml"`, `"10ml"`, `"Frasco completo 100ml"` |
| `price` | `numeric` | Precio actual de la variante |
| `available` | `boolean` | Disponible o agotado (sin número exacto de stock) |

#### `orders`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `customer_name` | `text` | Nombre del cliente |
| `customer_phone` | `text` | Teléfono del cliente |
| `customer_email` | `text` | Email del cliente |
| `delivery_type` | `text` | `"local"` o `"paqueteria"` |
| `delivery_address` | `text` | Dirección (solo aplica si `delivery_type = "paqueteria"`) |
| `status` | `text` | `"pendiente"` → `"preparando"` → `"enviado"` → `"entregado"` |
| `total` | `numeric` | Total del pedido al momento de la compra |
| `created_at` | `timestamp` | Fecha del pedido |

#### `order_items`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `order_id` | `uuid` FK → `orders` | Pedido al que pertenece |
| `variant_id` | `uuid` FK → `variants` | Variante comprada |
| `quantity` | `int` | Cantidad de esa variante |
| `unit_price` | `numeric` | Precio al momento de la compra (inmutable) |

### Decisiones de modelo de datos

- **`order_items.unit_price` guarda el precio histórico.** Si el dueño modifica el precio de una variante, los pedidos anteriores conservan el precio original. Nunca calcular totales históricos desde `variants.price`.
- **`products.is_active` permite soft-delete.** Desactivar un producto lo oculta del catálogo sin borrar su registro ni afectar el historial de pedidos.
- **`variants.available` es booleano**, no un contador de stock. El dueño marca disponible/agotado manualmente desde el panel admin.
- **`products.type`** tiene dos valores: `"decant"` o `"original"`. Permite filtrar el catálogo y mostrar el badge correcto en la tarjeta de producto.
- **`orders.delivery_type`** contempla entrega local y por paquetería desde el MVP, aunque solo la local esté activa al lanzar.

---

## 3. Decisiones de arquitectura

### Flujo de integración MercadoPago (Checkout Pro)

```
Frontend (carrito listo)
    │
    ▼
Supabase Edge Function
    │  Crea preferencia de pago con access token (seguro, server-side)
    ▼
API MercadoPago
    │  Devuelve URL de pago
    ▼
Frontend redirige al usuario
    │
    ▼
MercadoPago (flujo externo — pago procesado)
    │
    ▼
Redirección a /confirmacion?payment_id=xxx
    │
    ▼
Frontend lee payment_id → guarda pedido en Supabase → muestra confirmación
```

> ⚠️ **Alerta:** El access token de MercadoPago **nunca** se expone en el frontend. La Edge Function de Supabase actúa como intermediario seguro. Sin ella, las keys quedarían visibles en el código del navegador.

### Flujo de notificación WhatsApp

En la página de confirmación se genera dinámicamente un link `wa.me`:

```
https://wa.me/52XXXXXXXXXX?text=Hola,%20hice%20un%20pedido%20en%20AegonPerfumes...
```

El texto pre-escrito incluye: nombre del cliente, productos y variantes, total y tipo de entrega. El dueño recibe el mensaje y actualiza el estatus del pedido desde el panel admin.

No se utiliza la API de WhatsApp Business (requiere aprobación de Meta y tiene costo). El link generado es suficiente para el MVP y mantiene el trato personalizado como parte del posicionamiento de la marca.

### Row Level Security (RLS) — Supabase

| Tabla | Lectura pública | Escritura pública | Solo admin |
|---|---|---|---|
| `categories` | ✅ | ❌ | ✅ |
| `brands` | ✅ | ❌ | ✅ |
| `products` | ✅ (solo `is_active = true`) | ❌ | ✅ |
| `variants` | ✅ | ❌ | ✅ |
| `orders` | ❌ | ✅ (solo insert) | ✅ (lectura y edición) |
| `order_items` | ❌ | ✅ (solo insert) | ✅ (lectura y edición) |

Un visitante puede leer el catálogo e insertar pedidos. No puede leer pedidos ajenos ni modificar el catálogo.

---

## Retrospectiva de Fase 2

### Qué decidimos
- Sitemap de 7 páginas con flujo de compra lineal
- Modelo de 6 tablas; `order_items` guarda `unit_price` para preservar precios históricos
- MercadoPago requiere Supabase Edge Function — es un requisito de seguridad, no opcional
- RLS definida por tabla antes de escribir frontend
- `delivery_type` en órdenes contempla local y paquetería desde el día uno

### Qué viene en Fase 3
Sistema de diseño visual: paleta de colores, tipografía, espaciado y componentes clave documentados como variables CSS. Wireframes de páginas principales y flujo de usuario completo.

---

*Proyecto: AegonPerfumes — Desarrollado por Carlos*
*Fase 2 completada*