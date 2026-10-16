# Readably

Aplicación web para convertir EPUB y PDF con texto a lectura biónica personalizable. Los documentos se procesan en el navegador; no se suben a ningún servidor.

> La lectura biónica es una herramienta de personalización visual. No es un tratamiento y no está demostrado de forma general que mejore la comprensión.

## Stack

- React 18 + TypeScript + Vite 6 + Tailwind CSS 3 + React Router 6
- **EPUB:** epub.js (metadatos, spine, índice, recursos) + JSZip (reescritura del paquete al exportar)
- **PDF:** pdf.js (extracción de texto e imágenes) + pdf-lib (generación del PDF transformado)
- **Cuenta y Premium (desactivados en el lanzamiento, `VITE_PREMIUM_ENABLED=false`):** Firebase (Authentication con Google o enlace por correo, Firestore con reglas estrictas) y Stripe Billing (Checkout, Portal, webhook firmado) mediante Cloud Functions
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
  auth/        cliente Firebase (carga diferida), acciones de cuenta y lectura de la suscripción
src/components/, src/pages/, src/hooks/  interfaz
functions/     Cloud Functions (Stripe: checkout, portal y webhook) y reglas de suscripción
firestore.rules, firebase.json   reglas de Firestore y emuladores
scripts/seo-build.mjs   post-build: HTML por ruta, canonical, sitemap, robots
```

Decisiones relevantes:

- **Negrita sin regex sobre el HTML.** La transformación recorre los nodos de texto del DOM. Omite `script`, `style`, `code`, `pre` y enlaces de atributos. Cada nodo transformado queda envuelto en `span.bionic-text`, así que una segunda pasada no lo vuelve a tocar.
- **Vista previa aislada.** Se muestra en un `iframe` con `sandbox=""` (sin scripts ni origen propio) y una CSP `default-src 'none'`.
- **Sanitizado en importación y exportación.** Se eliminan scripts, manejadores `on*`, URLs `javascript:`, iframes, formularios y objetos. Las imágenes del EPUB se incrustan como `data:` solo para formatos raster.
- **EPUB exportado.** Se conserva el ZIP original (mimetype primero y sin comprimir, recursos byte a byte). Solo cambian los capítulos y el OPF (se registra una hoja de estilo con la tipografía elegida). Antes de descargar, el resultado se reabre con JSZip y con epub.js; si algo falla, no se entrega.
- **PDF exportado.** Es una reconstrucción A4 con negrita bionica real (fragmento en negrita y resto en normal). Las fuentes estándar solo cubren WinAnsi: el resto de caracteres se sustituye por `?` y se avisa.
- **Premium nunca se decide en el cliente.** El estado sale de `entitlement`, que lee la tabla `subscriptions`. Esa tabla solo la escribe el webhook de Stripe tras verificar la firma. Nada de Premium se guarda en `localStorage`. Ante un error, los anuncios no se ocultan.
- **Ventajas de Premium.** Quitar anuncios, archivos de hasta 100 MB y conversión por lotes (hasta 20 archivos, ZIP). Los límites se aplican en el navegador, porque los archivos nunca llegan a un servidor: son una comodidad, no una barrera de seguridad. Solo se activan con `status === 'premium'` confirmado por el backend.
- **Anuncios.** Política única en `src/lib/state/ads.ts`: sin consentimiento de publicidad no se carga **ningún** script de anuncios (ni «no personalizados»: en la UE también usan cookies y requieren consentimiento); Premium verificado nunca ve anuncios; sin identificadores válidos no hay anuncios en producción; en desarrollo aparece un placeholder marcado como tal. Hueco reservado de 280 px para evitar saltos de diseño, siempre fuera del texto leído y lejos de los controles.
- **Analítica.** Solo con consentimiento y a un endpoint propio (`VITE_ANALYTICS_ENDPOINT`). Los parámetros pasan por una lista blanca: nunca nombres de archivo, texto ni contenido de libros.

## Paleta

Derivada del logo (libro pastel) y deliberadamente cálida: **no** usa el azul eléctrico ni el degradado azul-violeta típicos de las plantillas «de IA». Definida en `tailwind.config.js`:

| Token | Valor | Uso |
|---|---|---|
| `button-gradient` | `#a8dcfb → #c3b7ec → #fdc4cf` | Botón primario, con texto oscuro (contraste ≥ 9:1) |
| `brand-gradient` | Cielo → pervinca → lavanda → rosa | Filete de cabecera y detalles decorativos |
| `brand` | `#b83a7d` (hover `#9d326b`, soft `#fbeff5`) | Enlaces, estado activo, sliders, interruptor |
| `white` | `#ffffff` | Fondo de página |
| `ink` | `#171b36` (soft `#4b506c`) | Texto |
| `slate` | Neutros con tinte pervinca | Bordes y fondos |

Los pasteles del logo no tienen contraste suficiente para texto, por eso el texto de acento usa una frambuesa profunda (rosa + lavanda del logo) con ≥ 4,7:1 sobre blanco y su tinte. Cualquier color nuevo debe pasar esa comprobación; la batería de accesibilidad (axe-core) la verifica. Los avisos conservan rojo, verde y ámbar porque su color comunica significado.

## Idiomas

La web está en español (raíz) y en inglés (`/en/`). El idioma lo decide la URL: no hay redirección automática por el idioma del navegador y el selector está siempre visible.

- **Textos de interfaz:** `src/i18n/dict.ts`. `en` se tipa como `typeof es`, así que TypeScript no compila si falta una clave.
- **Rutas:** `src/content/routes.json`. Cada ruta tiene un `id` estable y su versión en cada idioma; el código enlaza con `href('id')`.
- **Guías, FAQ y textos legales:** `src/content/seo-pages.ts` (es), `seo-pages.en.ts` (en), `faq.json` y `legal.ts`.
- **Errores y avisos:** `lib/` emite códigos y parámetros, no texto; cada idioma los redacta.
- **SEO:** `scripts/seo-build.mjs` genera una página estática por ruta e idioma con `hreflang`, canonical, `og:locale`, datos estructurados y sitemap con alternativas.
- **Marca:** «Lectura biónica» en español y «Readably» en inglés (coincide con el dominio).
- **Premium y cuenta** existen solo en español y están apagados.

Para añadir una guía: añade la ruta en `routes.json`, su contenido en cada idioma y su `id` en `GUIDE_IDS` de `src/App.tsx`. Los tests fallan si falta alguna pieza.

## Variables de entorno

Todas son públicas (`VITE_*`). Los secretos van solo en Firebase (ver abajo). La `apiKey` de Firebase es pública por diseño.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_SITE_URL` | En producción | URL pública sin barra final. Canonical, sitemap y URLs de retorno de Stripe |
| `VITE_MAX_FILE_MB` | No | Tamaño máximo de archivo. Por defecto 20 |
| `VITE_ADSENSE_CLIENT` | Para anuncios | Formato `ca-pub-` + 16 dígitos. Solo tras aprobación de AdSense |
| `VITE_ADSENSE_SLOT` | Para anuncios | Identificador del bloque de anuncios (solo dígitos) |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Para cuentas | App web de Firebase (Project settings) |
| `VITE_FIREBASE_FUNCTIONS_REGION` | No | Región de las funciones. Por defecto `europe-west1` |
| `VITE_PREMIUM_ENABLED` | No | `true` activa Premium, cuentas y sus páginas. Por defecto apagado |
| `VITE_BASE` | No | Ruta base si se sirve bajo un subdirectorio (p. ej. `/lectura-bionica/`). `npm run deploy:pages` la define |
| `VITE_PREMIUM_PRICE_LABEL` | No | Precio mostrado. Por defecto `2,99 €/mes` |
| `VITE_PREMIUM_YEARLY_PRICE_LABEL` | No | Precio anual mostrado. Por defecto `24,99 €/año` |
| `VITE_PREMIUM_TRIAL_DAYS` | No | Días de prueba anunciados (0 = sin prueba). Por defecto 7; igual que `STRIPE_TRIAL_DAYS` |
| `VITE_ANALYTICS_ENDPOINT` | No | Endpoint propio de analítica |

Parámetros de las funciones (`functions/.env.<id-del-proyecto>`, ver `functions/.env.example`) y secretos (`firebase functions:secrets:set`):

| Variable | Tipo | Descripción |
|---|---|---|
| `SITE_URL` | Parámetro | Igual que `VITE_SITE_URL`. Fija las URLs de retorno de Stripe (nunca se aceptan desde el cliente) |
| `STRIPE_PRICE_ID` | Parámetro | Price mensual de 2,99 € creado en Stripe |
| `STRIPE_PRICE_ID_YEARLY` | Parámetro | Price anual de 24,99 € creado en Stripe |
| `STRIPE_TRIAL_DAYS` | Parámetro | Días de prueba en la primera suscripción (por defecto 7; `0` la desactiva) |
| `STRIPE_SECRET_KEY` | Secreto | Clave secreta de Stripe (modo test primero) |
| `STRIPE_WEBHOOK_SECRET` | Secreto | Secreto de firma del endpoint de webhook |

Los pasos completos, en orden, están en [`docs/activar-premium.md`](docs/activar-premium.md).

**Cómo se decide Premium.** Solo el webhook de Stripe (verifica la firma) escribe `subscriptions/{uid}` en Firestore, con el Admin SDK. Las reglas (`firestore.rules`) permiten a cada usuario leer su documento y a nadie escribir. El navegador escucha ese documento en vivo, así que al volver de Stripe la cuenta pasa a Premium sin recargar.

Estado Premium: `active` y `trialing` dan acceso mientras `current_period_end` no haya pasado. `past_due` (pago fallido) **no** da acceso; la cancelación al final del periodo mantiene el acceso hasta esa fecha.

**Modo desarrollo sin Stripe:** si Firebase no está configurado, la página Premium indica que no está disponible. No se simulan pagos.

## Integraciones pendientes (requieren credenciales o aprobación externa)

| Integración | Estado | Qué falta |
|---|---|---|
| Google AdSense | Interfaz lista | Aprobación del sitio, `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT`, `public/ads.txt` real. En UE hace falta un CMP certificado por Google (IAB TCF); el banner actual es una base, no ese CMP |
| Firebase | Código listo | Proyecto (plan Blaze para Cloud Functions), reglas, secretos y despliegue de funciones. Probado con los emuladores y un Stripe simulado; **no verificado contra un proyecto real** |
| Stripe Billing | Código listo | Cuenta, producto y precio, webhook y Customer Portal. **No verificado con eventos reales** |
| Datos del titular | Pendiente | Sustituir los marcadores `[COMPLETAR]` de `src/content/legal.ts` |
| Cumplimiento RGPD / LSSI | No declarado | Revisión jurídica de textos, bases legales, encargos de tratamiento y transferencias |

## Limitaciones conocidas

- **PDF:** el orden de lectura sigue el texto del PDF. Columnas, tablas, notas al pie y fórmulas pueden no conservarse. Se conservan las imágenes incrustadas (se rasteriza la zona que ocupan, máx. 1400 px, 12 por página y 150 por documento); no los gráficos vectoriales. Se descartan iconos de <30 pt, las imágenes repetidas en ≥3 páginas (logotipos) y el escaneo de fondo de una página que ya tiene texto. Los PDF escaneados sin texto se detectan y se rechazan, sin OCR.
- **PDF exportado:** siempre sale en fondo blanco, para imprimir. No aplica el espaciado entre letras (pdf-lib no lo soporta).
- **EPUB:** el DRM o cifrado de contenido no se procesa. Los capítulos que no son XHTML estricto se conservan sin transformar y se avisa. Las imágenes SVG se muestran en la vista previa como imagen y se conservan tal cual en la exportación.
- **Web Workers:** el procesamiento corre en el hilo de la página (pdf.js usa su propio worker). La interfaz se mantiene fluida cediendo el control cada ~40 ms, con progreso y botón de cancelar. Las medidas están en `docs/lanzamiento.md`.
- **SEO:** las páginas estáticas llevan título, descripción, canonical y sitemap propios, pero su contenido se renderiza en cliente. Si el posicionamiento es prioritario, conviene prerenderizar el cuerpo (p. ej. con vite-ssg).
- **CSP:** se declara como `<meta>`. `frame-ancestors` solo puede configurarse en cabeceras del servidor. Si añades un endpoint de analítica, añádelo a `connect-src`.

## Pruebas

`npm test` (199 pruebas) cubre:

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
- Idiomas: mismas claves en es y en, mensajes para cada código de error y aviso, sin caracteres del español en la versión inglesa, pares hreflang recíprocos y renderizado de cada ruta en ambos idiomas.

Las pruebas de navegador real (Chrome, escritorio y móvil, accesibilidad con axe-core, consentimiento, Pages) y sus resultados están en `docs/lanzamiento.md`. Pendiente: pruebas contra un proyecto real de Firebase y eventos reales de Stripe (el flujo se probó con los emuladores y un Stripe simulado), el acceso con la ventana de Google, y dispositivos móviles reales.
