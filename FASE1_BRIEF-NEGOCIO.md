# Brief Completo de AegonPerfumes

## BRIEF DE NEGOCIO
Nombre del negocio: AegonPerfumes (Instagram: @aegonparfums)
Tipo de negocio: Revendedor de decants y perfumes originales completos
Antigüedad: Pocos meses de operación
Mercado objetivo: México — actualmente ciudad local, con expansión a envíos nacionales en camino
Canales actuales: Instagram, WhatsApp, venta presencial local
Proceso de venta actual: 100% manual por mensaje
Modelo de negocio

Revende perfumes de marcas reconocidas mundialmente: mercado árabe, diseñador y nicho
Ofrece dos modalidades de producto: decants (fracciones en varios tamaños) y frascos completos originales
No produce sus propios decants — los consigue y fracciona para reventa
El volumen actual del catálogo es aproximadamente 100 perfumes

## Posicionamiento

Diferenciador principal: Variedad y selección exclusiva — catálogo más amplio que competidores locales
Secundario: Atención personalizada, autenticidad garantizada, presencia en redes sociales con contenido propio
Tono de marca: Elegante, sofisticado, confiable — sin caer en lujo inaccesible

## Modelo de entrega

Actualmente: entregas locales en su ciudad
Próximamente: envíos por paquetería a todo México
El MVP debe contemplar ambas modalidades desde el diseño, aunque solo la local esté activa al lanzar

## Modelo de pago

MercadoPago (México) para pagos en línea
WhatsApp como canal de cierre y atención personalizada


# BRIEF TÉCNICO
## Objetivos del negocio

Reducir el tiempo que el dueño dedica a responder mensajes repetitivos (precio, disponibilidad, tamaños)
Permitir que un cliente complete una compra sin necesidad de escribir por WhatsApp
Proyectar una imagen profesional acorde al posicionamiento de marca
Tener un catálogo actualizable sin depender de un desarrollador

## Objetivos concretos de la tienda

Catálogo navegable y filtrable por categoría, tipo (decant/original), marca y precio
Ficha de producto con selector de variante (tamaño + precio)
Carrito funcional que soporte múltiples productos y variantes
Checkout integrado con MercadoPago
Notificación automática al dueño por WhatsApp cuando llega un pedido
Panel de administración para gestionar productos, stock y pedidos


## BUYER PERSONAS
Persona 1 — "La curiosa de nicho"

Mujer, 22–35 años
Sigue cuentas de perfumería en Instagram, conoce marcas de nicho
Quiere probar antes de invertir en un frasco completo
Llega desde un Reel o una Story de AegonPerfumes
Entra desde el celular, quiere decidir rápido
Le importa saber qué huele, cuánto dura, si es árabe o diseñador
Lo que necesita de la tienda: descripción del perfume clara, foto atractiva, precio visible, proceso de compra sin fricción

## Persona 2 — "El coleccionista de kits"

Hombre o mujer, 25–40 años
Ya conoce el negocio, es cliente recurrente
Arma "kits" de 3–5 decants por pedido para tener variedad
Le interesa explorar el catálogo completo
Valora que el carrito recuerde lo que eligió
Lo que necesita de la tienda: filtros buenos, carrito claro con resumen por variante, total visible en todo momento

## Persona 3 — "El comprador de original"

Perfil mixto, 28–45 años
Ya sabe qué quiere — un frasco completo de una marca específica
Busca autenticidad y precio justo
Puede llegar por recomendación o directo desde WhatsApp
Lo que necesita de la tienda: ficha de producto con información completa, badge de "original", proceso de pago rápido y confiable


## ALCANCE DEL MVP — Qué entra y qué no
✅ Entra en V1

Catálogo completo con filtros (categoría, tipo, marca, precio)
Ficha de producto con variantes de tamaño/precio
Carrito lateral persistente
Checkout con MercadoPago (Checkout Pro)
Notificación al dueño por WhatsApp (link generado automáticamente)
Panel de administración: gestión de productos, variantes, stock y pedidos
Responsive mobile-first
Página de confirmación de pedido
Modalidad de entrega: local y paquetería (campo en checkout, lógica de envío simple)

❌ No entra en V1 (queda para V2)

Sistema de cupones o descuentos
Reseñas o valoraciones de productos
Lista de deseos (wishlist)
Login de clientes (historial de pedidos)
Envíos con cálculo automático de tarifa por zona
Notificaciones por email al cliente
Analytics o dashboard de ventas
"Arma tu kit" como flujo guiado (puede ser sugerido visualmente, pero no como lógica separada)


## DECISIONES TÉCNICAS INICIALES
[DECISIÓN] MercadoPago: Checkout Pro
Usaremos Checkout Pro en lugar de Checkout API. Razón: Checkout API requiere backend propio para procesar pagos de forma segura — con Vanilla JS sin backend real, exponer las keys sería un riesgo de seguridad. Checkout Pro redirige al usuario a la página de MercadoPago (o abre un modal), maneja todo el flujo de pago en su infraestructura y luego regresa a nuestra página de confirmación. Es más seguro, más rápido de implementar y ya transmite confianza al usuario porque reconoce la interfaz de MercadoPago.
[DECISIÓN] WhatsApp: link generado, no automatizado
La notificación al dueño será un link wa.me generado dinámicamente con el resumen del pedido pre-escrito. No usaremos la API de WhatsApp Business (requiere aprobación Meta, tiene costo). Esto es suficiente para el MVP y mantiene el toque personal que es parte del posicionamiento del negocio.
[DECISIÓN] Deploy: Netlify
Netlify sobre GitHub Pages porque necesitamos variables de entorno seguras para las keys de Supabase y MercadoPago. GitHub Pages es estático puro y no protege variables de entorno.

## MINI-RETROSPECTIVA DE FASE 1
Qué decidimos:

El producto tiene variantes (tamaño/precio) — no es un catálogo de productos simples
El carrito es indispensable — hay compras de múltiples productos
El panel admin necesita gestión de pedidos, no solo de productos
El posicionamiento es exclusividad + atención personalizada — el diseño debe reflejarlo
WhatsApp no es un parche — es parte de la experiencia de marca y hay que integrarlo bien

Por qué importa:
Cada una de estas decisiones va a aparecer en el modelo de datos de Fase 2. Si no las hubiéramos definido aquí, habríamos construido una estructura de base de datos que tendríamos que rehacer a mitad del proyecto.
Qué viene después — Fase 2:
Vamos a diseñar la arquitectura completa: el sitemap (qué páginas existen y cómo se conectan), el modelo de datos en Supabase (qué tablas, qué columnas, qué relaciones), y las decisiones de integración con MercadoPago y WhatsApp.