# Publicidad con Google AdSense: plan y pendientes

Estado a 2026-10-15: la parte técnica está construida y desactivada. Faltan los datos y las aprobaciones externas.

## Qué ya está hecho en el código

- Huecos publicitarios: al final de la portada, tras completar una conversión y al final de las guías. **Nunca** dentro del texto que se lee ni junto a los botones de conversión o descarga. Altura reservada de 280 px.
- Los anuncios se ocultan a usuarios Premium verificados.
- Sin consentimiento de cookies decidido no se carga ningún script de anuncios.
- Si el usuario rechaza la publicidad, no se carga ningún script de anuncios (tampoco «no personalizados»: en la UE también requieren consentimiento).
- Sin `VITE_ADSENSE_CLIENT` y `VITE_ADSENSE_SLOT` válidos no se muestra nada en producción (en desarrollo aparece un placeholder marcado).
- Política única en `src/lib/state/ads.ts`; componente en `src/components/AdSlot.tsx`.

## Pasos pendientes

| # | Paso | Quién | Notas |
|---|---|---|---|
| 1 | ~~Comprar un dominio~~ **Hecho: `readably.online`** (ver `docs/dominio.md`) | Tú | ~10 €/año. Probable bloqueo si falta: AdSense no suele aprobar subdominios de `github.io` |
| 2 | Apuntar el dominio a GitHub Pages (registros DNS + `CNAME`) | Claude, con el dominio | Ajustar también `VITE_SITE_URL` y la base (`PAGES_BASE=/`) en el despliegue |
| 3 | Rellenar los datos legales en `src/content/legal.ts` | Tú los das, Claude los pone | Hoy hay marcadores `[COMPLETAR]` visibles |
| 4 | Crear la cuenta en adsense.google.com y añadir el dominio | Tú | Mayor de edad; verificación de identidad y de pago |
| 5 | Colocar el código de verificación y `public/ads.txt` | Claude, con el ID de editor | Plantilla en `public/ads.txt.example` |
| 6 | Esperar la revisión de Google | Google | De unos días a varias semanas |
| 7 | Crear un bloque de anuncios y pasar `ca-pub-…` y el ID del bloque | Tú | Claude los configura como variables `VITE_*` y despliega |
| 8 | Activar el mensaje de consentimiento de AdSense (CMP) | Tú, en su panel | Obligatorio para usuarios del EEE; el banner actual bloquea de verdad la carga, pero no es un CMP certificado por Google |

## Datos que hay que facilitar (paso 3)

1. Nombre o razón social del titular (puede ser tu nombre).
2. Correo de contacto público, para privacidad y avisos.
3. Dirección postal y NIF, o confirmar que no se ponen. Es un dato legal real si hay actividad económica en España; conviene revisarlo con una gestoría.

Son datos personales y quedarán publicados en el sitio.

## Riesgos

- **Contenido escaso.** AdSense rechaza con frecuencia herramientas con poco texto ("contenido de poco valor"). Hay 5 guías cortas; conviene ampliarlas antes de solicitar. La aprobación no está garantizada.
- **Ingresos pequeños al principio.** Con poco tráfico serán mínimos.
- **No hacer clic en los propios anuncios.** Es motivo de expulsión de la cuenta.
- **Consentimiento en la UE.** Sin un CMP certificado (IAB TCF) no se pueden servir anuncios a usuarios del EEE.

## Cómo se activa cuando haya IDs

1. Definir en el entorno de build (no en el repositorio):
   - `VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX`
   - `VITE_ADSENSE_SLOT=<solo dígitos>`
   - `VITE_SITE_URL=https://<tu-dominio>`
2. Copiar `public/ads.txt.example` a `public/ads.txt` con la línea real del editor.
3. `npm run deploy:pages`, con `PAGES_BASE=/` si el sitio pasa a un dominio propio.
4. Comprobar en producción que el banner de cookies aparece, que sin consentimiento no se carga `adsbygoogle.js` y que Premium no ve anuncios.

## Pendiente de decidir

- Ampliar las guías antes de solicitar la aprobación (recomendado).
- Dominio: nombre y registrador.
