# Lanzamiento: estado, pruebas y tareas manuales

Estado a 2026-10-15. Premium, cuentas y pagos están **desactivados** (`VITE_PREMIUM_ENABLED=false`): el código sigue en el repositorio pero no hay rutas, enlaces ni textos legales que los mencionen.

## Cómo publicar los cambios

```bash
cd ~/Dev/lectura-bionica
npm test && npm run build         # 123 pruebas + tipos + build
git add -A && git commit -m "..."
git push origin main
npm run deploy:pages              # compila con la base de Pages y sube a gh-pages
```

Después, en GitHub → Settings → Pages: la fuente debe ser la rama `gh-pages`, carpeta `/`. Si el sitio no se actualiza, `gh api -X POST repos/JHI65/lectura-bionica/pages/builds` fuerza un build.

## Límite de tamaño (20 MB)

Un único valor: `DEFAULT_MAX_FILE_MB` en `src/lib/state/config.ts`, o `VITE_MAX_FILE_MB` en el build. Se valida antes de leer el archivo, y el mensaje indica el peso del archivo y el máximo.

Medido en Chrome de escritorio (headless, Apple Silicon), build de producción:

| Documento | Importar | Exportar | Memoria JS tras exportar | Salida |
|---|---|---|---|---|
| PDF 400 pág. de texto (0,4 MB) | 0,8 s | 1,1 s | 35 MB | 3,2 MB |
| PDF 17 MB con imágenes | 0,2 s | 0,1 s | 10 MB | texto solo |
| EPUB 16 MB, 250 capítulos | 0,8 s | 2,1 s | 32 MB | 15,8 MB |

Ninguna tarea superó 50 ms de bloqueo del hilo principal. **No medido:** móviles reales ni equipos con poca RAM; el límite de 20 MB es una cifra conservadora, no un valor probado en esos dispositivos. Se ajusta con una variable.

Antes de la corrección de hoy, el PDF de 400 páginas llegaba a **677 MB** y 10,6 MB de salida: pdf-lib creaba un objeto por operación de dibujo. Ahora se escribe el contenido de página directamente y comprimido.

## Pruebas ejecutadas (resultado real)

| Prueba | Resultado |
|---|---|
| `npm test` (vitest, jsdom) | 123/123 |
| `tsc --noEmit` | sin errores |
| Chrome real, escritorio y móvil (390×844): flujo EPUB y PDF, errores, cancelar, descarga | 40/40 |
| Misma batería bajo el prefijo `/lectura-bionica/` con `404.html` (simulación de GitHub Pages) | 40/40 |
| Consentimiento y anuncios en Chrome real (identificadores de prueba, solo en un build local) | 11/11 |
| Accesibilidad axe-core (WCAG 2.0/2.1 A y AA + buenas prácticas), 16 estados | 0 violaciones |
| Peticiones externas durante la conversión | 0 (todas al propio origen; sin POST) |
| Errores o avisos en consola | 0 |
| Móvil con CPU 4× más lenta y red 4G lenta: FCP/LCP 0,87 s, CLS 0, TBT 0, 107 KB | medido |
| `npm audit --omit=dev` | 0 vulnerabilidades |

**Límites de estas pruebas:** son lab, no usuarios reales; Chrome en macOS, no Safari/Firefox ni móviles físicos; los documentos de prueba son sintéticos. Las pruebas en GitHub Pages reales solo se pueden hacer tras publicar.

## Problemas encontrados y corregidos

- Vulnerabilidades en producción: `@xmldom/xmldom` (alta, no alcanzable en navegador) y `react-router` (moderada). Corregido con `overrides` y react-router-dom 7.18.
- Error de consola real de epub.js (`replaceCss`) por destruir el libro antes de que terminara; además creaba una URL de blob por cada imagen. Ahora no se generan.
- PDF exportado: 677 MB y 10,6 MB para 400 páginas → 35 MB y 3,2 MB.
- Reimportar un EPUB ya convertido no recalculaba la negrita; ahora se limpia y se avisa.
- Anuncios «no personalizados» se cargaban tras rechazar; ahora no se carga nada sin consentimiento.
- Un anuncio quedaba junto al botón de descarga; ahora solo aparece tras completar, lejos de los controles.
- Banner de cookies: ocupaba ~50 % de la pantalla móvil; ahora ~24 %.
- Enlaces en texto distinguibles solo por color (WCAG 1.4.1).
- Canonical sin barra final apuntaba a una URL que redirige.
- Imágenes de más de 3 MB desaparecían de la vista previa sin aviso.
- `registerVisit` no se llamaba nunca (visitas recurrentes sin medir).
- **Guías y páginas legales mostraban «Página no encontrada» al entrar por su URL con barra final** (la canónica). Detectado tarde porque las comprobaciones miraban el código HTTP y axe, no el contenido. Corregido, con prueba de renderizado de cada ruta (`tests/routes-render.test.ts`) y comprobación en Chrome de contenido real de las 11 rutas.

## Tareas manuales antes de lanzar

1. ~~Datos del titular~~ Publicados el 2026-10-15 (nombre, NIF, dirección, correo). Revisar con gestoría si el domicilio mostrado es el adecuado.
2. **Revisión legal** de privacidad, cookies, condiciones y aviso legal (RGPD y LSSI). Nada de esto se declara como cumplido.
3. **Dominio propio** si se quiere AdSense: `github.io` no suele aprobarse. Ver `docs/publicidad-adsense.md`.
4. **Search Console:** en un subdirectorio de `github.io`, `robots.txt` y `sitemap.xml` del sitio no los lee ningún rastreador (solo cuenta el de la raíz del host). Con dominio propio funcionan; hasta entonces, enviar la URL a mano.
5. **Probar en Safari, Firefox y un móvil real** con un EPUB y un PDF propios.

## Lista para activar la publicidad

- [ ] Dominio propio apuntando a Pages y `VITE_SITE_URL` + `PAGES_BASE=/` en el despliegue.
- [ ] Datos legales rellenos y textos revisados.
- [ ] Cuenta de AdSense creada, sitio aprobado y `public/ads.txt` real (plantilla en `public/ads.txt.example`).
- [ ] Mensaje de consentimiento de AdSense (CMP certificado) activado en su panel.
- [ ] Bloque de anuncios creado: `VITE_ADSENSE_CLIENT` y `VITE_ADSENSE_SLOT` en el entorno de build.
- [ ] Desplegar y comprobar en producción: sin consentimiento no hay peticiones a `googlesyndication`; con consentimiento aparece el hueco; el hueco no desplaza el contenido (CLS).
- [ ] Revisar que no hay anuncios junto a botones ni dentro del texto leído.

## Analítica

Preparada y apagada: no se envía nada sin `VITE_ANALYTICS_ENDPOINT` y consentimiento. Eventos: `page_view`, `landing_view` (con `source`: solo dominio de origen o `utm_source`), `conversion_started` (selección de archivo), `format_imported`, `conversion_completed`, `download_completed`, `conversion_error` (solo el código), `returning_visit`. No hay proveedor integrado: para medir hace falta un endpoint propio o adaptar `src/lib/state/analytics.ts` a uno que se elija. Si se añade un endpoint, incluirlo en `connect-src` del CSP de `index.html`.
