# AegonPerfumes

Tienda en línea de decants y perfumes originales (árabe, diseñador y nicho), construida
para un cliente real de México. En producción, con flujo de compra completo, panel de
administración propio y pagos con tarjeta y OXXO.

**🔗 Sitio en vivo:** [carlosnm0802.github.io/aegon-perfumes](https://carlosnm0802.github.io/aegon-perfumes)

---

## El problema

El cliente ya vendía perfumes y decants por Instagram y WhatsApp, pero todo el proceso
era manual: catálogo en fotos sueltas, pagos coordinados por chat, sin forma de saber
qué había en stock sin preguntarle directamente. Eso funciona con pocos clientes, pero
no escala, y cada venta le costaba tiempo que podría estar usando en preparar producto.

Necesitaba una tienda real — pero una que **él mismo pudiera operar sin depender de un
desarrollador** cada vez que quisiera agregar un perfume o cambiar un precio.

## La solución

Una tienda multipágina, rápida y mobile-first (la mayoría de sus compradores llegan
desde Instagram, directo del celular), con:

- Catálogo con filtros por categoría, marca y tipo (decant / frasco completo)
- Carrito persistente y checkout con pago en línea (tarjeta y OXXO)
- Confirmación de pedido y notificación automática por correo
- Panel de administración propio, protegido con autenticación, donde el dueño gestiona
  productos, precios, variantes, imágenes, pedidos y disponibilidad sin tocar código

## Decisiones técnicas clave

### El pivote de pagos: MercadoPago → Stripe

La integración de pagos empezó con MercadoPago, la opción más natural para México. A
mitad de la Fase 4 nos topamos con un bloqueo real: `PA_UNAUTHORIZED_RESULT_FROM_POLICIES`,
un error persistente causado por verificación de identidad incompleta en la cuenta del
cliente, que bloqueaba las llamadas a la API incluso en modo de prueba.

Después de confirmar que no era un error de integración sino una limitación de cuenta
fuera de nuestro control, migramos a **Stripe Checkout** (tarjeta + OXXO). La lección
no fue solo técnica: fue reconocer cuándo un bloqueo no se resuelve escribiendo más
código, sino cambiando de herramienta.

### Arquitectura del carrito y los pedidos

El carrito vive en `localStorage` mientras el cliente compra — no toca la base de datos
hasta que decide pagar. En ese momento se pre-crea el pedido en Supabase con un UUID
generado desde el propio navegador, *antes* de redirigir a Stripe. La confirmación real
del pago no la decide el navegador (que puede cerrarse, perder conexión, etc.), sino una
**Edge Function que escucha el webhook de Stripe** de forma asíncrona y actualiza el
pedido de `pendiente` a `preparando` cuando el pago se confirma del lado del servidor.

Esto significa que un pedido puede quedar `pendiente` sin pago completado (por ejemplo,
si el cliente cierra la pestaña a medio pago) — es un trade-off consciente: preferimos
tener registro temprano del intento de compra a arriesgar perder el pedido si el pago sí
se completa pero el navegador nunca vuelve a la página de confirmación.

### Vanilla JS, sin framework

Con un catálogo de ~100 productos y sin necesidad de estado complejo entre pantallas,
un framework como React habría agregado una capa de build y dependencias que no
compraba nada a cambio. HTML multipágina con JavaScript por módulos (ES Modules) es
más simple de mantener a largo plazo por un solo desarrollador, y más fácil de
depurar en producción sin herramientas adicionales.

### Seguridad por diseño, no como parche

Row Level Security (RLS) se activó en Supabase desde la primera tabla creada, en modo
"cerrado por defecto" — cada permiso de lectura o escritura se abrió explícitamente
según se necesitó, en vez de empezar abierto y cerrar huecos después. El panel de admin
usa Supabase Auth con un guard (`requireAuth()`) que protege cada página del panel.
Las llaves sensibles (Service Role Key de Supabase, Secret Key de Stripe) viven
únicamente como variables de entorno dentro de las Edge Functions — nunca en el
frontend ni en el repositorio.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vanilla JavaScript (ES Modules), HTML multipágina, CSS con sistema de diseño propio |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions con Deno) |
| Pagos | Stripe Checkout (tarjeta y OXXO) |
| Hosting | GitHub Pages |

## Resultado

El proyecto pasó por un ciclo completo de QA antes de entrega: flujo de compra
verificado en las cinco capas (carrito → Edge Function → Supabase → Stripe → panel de
admin), incluyendo pago exitoso con tarjeta, pago con OXXO, los tres escenarios de
rechazo de tarjeta, y los cuatro casos límite del negocio (variante agotada, pago
cancelado, carrito vacío en checkout directo, sesión de admin expirada). El
responsive se probó en dispositivo físico, no solo en simulador de navegador —
incluyendo el panel de administración completo.

Hoy el cliente puede gestionar todo su catálogo, precios e inventario desde el panel,
sin escribir una línea de código.

---

*Proyecto desarrollado por [Carlos](https://github.com/carlosnm0802) como parte de su
portafolio como desarrollador web.*