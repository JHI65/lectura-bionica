# Lectura biónica

Aplicación web para convertir EPUB y PDF con texto a lectura biónica personalizable. Los documentos se procesan en el navegador; no se suben a ningún servidor.

> La lectura biónica es una herramienta de personalización visual. No es un tratamiento y no está demostrado de forma general que mejore la comprensión.

## Stack

- React 18 + TypeScript + Vite 6 + Tailwind CSS 3 + React Router 6
- **EPUB:** epub.js (metadatos, spine, índice, recursos) + JSZip (reescritura del paquete al exportar)
- **PDF:** pdf.js (extracción de texto) + pdf-lib (generación del PDF transformado)
- **Cuenta y Premium (desactivados en el lanzamiento, `VITE_PREMIUM_ENABLED=false`):** Supabase (auth por enlace de correo, tabla de suscripciones con RLS) y Stripe Billing (Checkout, Portal, webhook firmado) mediante Edge Functions
- **Publicidad:** Google AdSense, cargado solo con configuración válida y consentimiento

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # opcional: sin variables, la app funciona sin cuenta ni anuncios
npm run dev                  # http://localhost:5173
```

Scripts:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas (algoritmo, DOM, sanitizado, validación, EPUB y PDF de extremo a extremo) |
| `npm run typecheck` | Comprobación de tipos |
| `npm run build` | Typecheck + build de producción + páginas SEO estáticas + sitemap |
| `npm run preview` | Sirve el build de producción |

## Arquitectura

```
src/lib/
  bionic/      algoritmo puro (splitWord, segmentText), ajustes, CSS de lectura
  html/        transformación sobre el DOM (idempotente) y sanitizador por lista blanca
  files/       validación por firma binaria (no por extensión), errores con código
  epub/        parse (epub.js) y export (reescribe los capítulos, verifica el resultado)
  pdf/         layout de líneas/párrafos, parse (pdf.js), export (pdf-lib)
  convert.ts   orquestador: validar → extraer → exportar
  state/       preferencias locales, consentimiento, analítica, política de anuncios
  auth/        cliente Supabase y consulta de entitlement (siempre al backend)
src/components/, src/pages/, src/hooks/  interfaz
supabase/      migración SQL, config y Edge Functions (Stripe + entitlement)
scripts/seo-build.mjs   post-build: HTML por ruta, canonical, sitemap, robots
```

Decisiones relevantes:

- **Negrita sin regex sobre el HTML.** La transformación recorre los nodos de texto del DOM. Omite `script`, `style`, `code`, `pre` y enlaces de atributos. Cada nodo transformado queda envuelto en `span.bionic-text`, así que una segunda pasada no lo vuelve a tocar.
- **Vista previa aislada.** Se muestra en un `iframe` con `sandbox=""` (sin scripts ni origen propio) y una CSP `default-src 'none'`.
- **Sanitizado en importación y exportación.** Se eliminan scripts, manejadores `on*`, URLs `javascript:`, iframes, formularios y objetos. Las imágenes del EPUB se incrustan como `data:` solo para formatos raster.
- **EPUB exportado.** Se conserva el ZIP original (mimetype primero y sin comprimir, recursos byte a byte). Solo cambian los capítulos y el OPF (se registra una hoja de estilo con la tipografía elegida). Antes de descargar, el resultado se reabre con JSZip y con epub.js; si algo falla, no se entrega.
- **PDF exportado.** Es una reconstrucción A4 con negrita bionica real (fragmento en negrita y resto en normal). Las fuentes estándar solo cubren WinAnsi: el resto de caracteres se sustituye por `?` y se avisa.
- **Premium nunca se decide en el cliente.** El estado sale de `entitlement`, que lee la tabla `subscriptions`. Esa tabla solo la escribe el webhook de Stripe tras verificar la firma. Nada de Premium se guarda en `localStorage`. Ante un error, los anuncios no se ocultan.
- **Anuncios.** Política única en `src/lib/state/ads.ts`: sin consentimiento de publicidad no se carga **ningún** script de anuncios (ni «no personalizados»: en la UE también usan cookies y requieren consentimiento); Premium verificado nunca ve anuncios; sin identificadores válidos no hay anuncios en producción; en desarrollo aparece un placeholder marcado como tal. Hueco reservado de 280 px para evitar saltos de diseño, siempre fuera del texto leído y lejos de los controles.
- **Analítica.** Solo con consentimiento y a un endpoint propio (`VITE_ANALYTICS_ENDPOINT`). Los parámetros pasan por una lista blanca: nunca nombres de archivo, texto ni contenido de libros.

## Variables de entorno

Todas son públicas (`VITE_*`). Los secretos van solo en Supabase (ver abajo).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_SITE_URL` | En producción | URL pública sin barra final. Canonical, sitemap y URLs de retorno de Stripe |
| `VITE_MAX_FILE_MB` | No | Tamaño máximo de archivo. Por defecto 20 |
| `VITE_ADSENSE_CLIENT` | Para anuncios | Formato `ca-pub-` + 16 dígitos. Solo tras aprobación de AdSense |
| `VITE_ADSENSE_SLOT` | Para anuncios | Identificador del bloque de anuncios (solo dígitos) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Para cuentas | Proyecto de Supabase |
| `VITE_PREMIUM_ENABLED` | No | `true` activa Premium, cuentas y sus páginas. Por defecto apagado |
| `VITE_BASE` | No | Ruta base si se sirve bajo un subdirectorio (p. ej. `/lectura-bionica/`). `npm run deploy:pages` la define |
| `VITE_PREMIUM_PRICE_LABEL` | No | Precio mostrado. Por defecto `2,99 €/mes` |
| `VITE_ANALYTICS_ENDPOINT` | No | Endpoint propio de analítica |

Variables del servidor (Supabase → Edge Functions → Secrets):

| Variable | Descripción |
|---|---|
| `SITE_URL` | Igual que `VITE_SITE_URL`. Define el CORS y las URLs de retorno (nunca se aceptan desde el cliente) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (modo test primero) |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma del endpoint de webhook |
| `STRIPE_PRICE_ID` | Price de 2,99 €/mes creado en Stripe |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase automáticamente.

## Configurar Supabase y Stripe

1. **Base de datos.** En Supabase, ejecuta `supabase/migrations/0001_subscriptions.sql`. Activa el proveedor de email (magic link) en *Authentication*.
2. **Funciones.** `supabase functions deploy entitlement create-checkout-session create-portal-session stripe-webhook`. `supabase/config.toml` desactiva la verificación JWT solo para el webhook.
3. **Secretos.** `supabase secrets set SITE_URL=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... STRIPE_PRICE_ID=...`
4. **Stripe.**
   - Crea un producto con un precio recurrente mensual de 2,99 € (EUR).
   - En *Webhooks*, apunta a `https://<proyecto>.supabase.co/functions/v1/stripe-webhook` y escucha: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
   - Activa el *Customer Portal* (cambio de método de pago, facturas y cancelación).
5. **Frontend.** Rellena `.env.production` con las variables `VITE_*`. Despliega `dist/` en un hosting estático. El fichero `public/_redirects` sirve para Netlify o Cloudflare Pages; en otros hosts configura la reescritura de rutas a `index.html`.

Estado Premium: `active` y `trialing` dan acceso mientras `current_period_end` no haya pasado. `past_due` (pago fallido) **no** da acceso; la cancelación al final del periodo mantiene el acceso hasta esa fecha.

**Modo desarrollo sin Stripe:** si Supabase no está configurado, la página Premium indica que no está disponible. No se simulan pagos.

## Integraciones pendientes (requieren credenciales o aprobación externa)

| Integración | Estado | Qué falta |
|---|---|---|
| Google AdSense | Interfaz lista | Aprobación del sitio, `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT`, `public/ads.txt` real. En UE hace falta un CMP certificado por Google (IAB TCF); el banner actual es una base, no ese CMP |
| Supabase | Código listo | Proyecto, migración, secretos y despliegue de funciones. **No verificado contra un proyecto real** |
| Stripe Billing | Código listo | Cuenta, producto y precio, webhook y Customer Portal. **No verificado con eventos reales** |
| Plan anual | No publicado | Intencionadamente fuera; requiere su propio Price en Stripe |
| Datos del titular | Pendiente | Sustituir los marcadores `[COMPLETAR]` de `src/content/legal.ts` |
| Cumplimiento RGPD / LSSI | No declarado | Revisión jurídica de textos, bases legales, encargos de tratamiento y transferencias |

## Limitaciones conocidas

- **PDF:** el orden de lectura sigue el texto del PDF. Columnas, tablas, notas al pie y fórmulas pueden no conservarse. Los PDF escaneados se detectan y se rechazan, sin OCR.
- **PDF exportado:** siempre sale en fondo blanco, para imprimir. No aplica el espaciado entre letras (pdf-lib no lo soporta).
- **EPUB:** el DRM o cifrado de contenido no se procesa. Los capítulos que no son XHTML estricto se conservan sin transformar y se avisa. Las imágenes SVG de portada no se muestran en la vista previa.
- **Web Workers:** el procesamiento corre en el hilo de la página (pdf.js usa su propio worker). La interfaz se mantiene fluida cediendo el control cada ~40 ms, con progreso y botón de cancelar. Las medidas están en `docs/lanzamiento.md`.
- **SEO:** las páginas estáticas llevan título, descripción, canonical y sitemap propios, pero su contenido se renderiza en cliente. Si el posicionamiento es prioritario, conviene prerenderizar el cuerpo (p. ej. con vite-ssg).
- **CSP:** se declara como `<meta>`. `frame-ancestors` solo puede configurarse en cabeceras del servidor. Si añades un endpoint de analítica, añádelo a `connect-src`.

## Pruebas

`npm test` (123 pruebas) cubre:

- Algoritmo: tildes, ñ, puntuación, combinaciones Unicode, alfabetos no latinos, cifras, palabras de una letra.
- DOM: el texto visible no cambia, enlaces y código intactos, idempotencia.
- Sanitizado: scripts, manejadores, `javascript:`, iframes, imágenes no seguras.
- Validación: firma real frente a extensión, tamaño, vacíos, PDF sin texto, PDF truncado, EPUB con DRM, ZIP que no es EPUB.
- Ciclo completo: importar EPUB y PDF generados, exportar, reabrir y comprobar la estructura; el texto exportado se vuelve a extraer íntegro.
- Privacidad: ninguna petición de red (fetch, XHR, beacon) durante importar y exportar.
- Enlaces internos: todo `to="/ruta"` existe en `routes.json`.
- Anuncios y consentimiento: sin decidir o rechazado no hay anuncios; Premium nunca los ve; sin identificadores, nada.
- Analítica: lista blanca de parámetros, sin nombres de archivo; nada se envía sin consentimiento.
- Límites, cancelación, progreso y errores de memoria.

Las pruebas de navegador real (Chrome, escritorio y móvil, accesibilidad con axe-core, consentimiento, Pages) y sus resultados están en `docs/lanzamiento.md`. Pendiente: pruebas de las Edge Functions con la CLI de Supabase y eventos de prueba de Stripe, y dispositivos móviles reales.
