// Post-build de SEO. Tras `vite build`:
//  - genera dist/<ruta>/index.html con título, descripción, canonical y Open Graph
//    propios de cada página, para que los rastreadores los lean sin ejecutar JS;
//  - genera sitemap.xml a partir de src/content/routes.json (sin las noindex);
//  - añade la línea Sitemap a robots.txt.
// Usa VITE_SITE_URL de .env / .env.production (o del entorno).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// DIST_DIR permite generar el SEO sobre un build en otra carpeta (pruebas).
const dist = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : join(root, 'dist');
const env = loadEnv('production', root, 'VITE_');
const siteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || '').replace(/\/+$/, '');
const premiumEnabled = (process.env.VITE_PREMIUM_ENABLED || env.VITE_PREMIUM_ENABLED) === 'true';
// Las rutas que dependen de Premium solo se publican si está activado.
const routes = JSON.parse(readFileSync(join(root, 'src/content/routes.json'), 'utf8')).filter(
  (route) => route.requires !== 'premium' || premiumEnabled,
);
const template = readFileSync(join(dist, 'index.html'), 'utf8');

if (!siteUrl) {
  console.warn('[seo] VITE_SITE_URL no está definida: canonical, Open Graph y sitemap no se generan. Defínela antes de publicar.');
}

const maxMb = Number(process.env.VITE_MAX_FILE_MB || env.VITE_MAX_FILE_MB) || 20;

// Datos estructurados de la portada: aplicación web gratuita + preguntas frecuentes.
function homeJsonLd() {
  const faq = JSON.parse(readFileSync(join(root, 'src/content/faq.json'), 'utf8')).filter(
    (item) => !item.premium || premiumEnabled,
  );
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Conversor PDF/EPUB a Lectura Biónica',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: 'es',
      isAccessibleForFree: true,
      description: 'Convierte EPUB y PDF con texto a lectura biónica personalizable, procesados en tu navegador.',
      ...(siteUrl ? { url: `${siteUrl}/` } : {}),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a.replace('{maxMb}', String(maxMb)) },
      })),
    },
  ];
  // </ en JSON dentro de <script> podría cerrar la etiqueta: se escapa.
  return data
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');
}

// GitHub Pages (y la mayoría de hosts estáticos) sirven cada ruta como carpeta y
// redirigen /ruta → /ruta/. La URL canónica es la final, con barra.
const canonicalUrl = (path) => `${siteUrl}${path === '/' ? '/' : `${path}/`}`;

const escape = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function pageHtml(route) {
  const title = /lectura bi[oó]nica/i.test(route.title) ? route.title : `${route.title} · Lectura biónica`;
  const description = route.description;
  const canonical = siteUrl ? canonicalUrl(route.path) : '';
  const head = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<meta name="robots" content="${route.noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<meta property="og:title" content="${escape(route.title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:type" content="website" />`,
    canonical ? `<meta property="og:url" content="${escape(canonical)}" />` : '',
    siteUrl ? `<meta property="og:image" content="${escape(`${siteUrl}/icon-512.png`)}" />` : '',
    route.path === '/' ? homeJsonLd() : '',
    canonical ? `<link rel="canonical" href="${escape(canonical)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  return template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`);
}

for (const route of routes) {
  const html = pageHtml(route);
  if (route.path === '/') {
    writeFileSync(join(dist, 'index.html'), html);
    continue;
  }
  const dir = join(dist, route.path.slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

if (siteUrl) {
  const urls = routes
    .filter((r) => !r.noindex)
    .map((r) => `  <url><loc>${escape(canonicalUrl(r.path))}</loc></url>`)
    .join('\n');
  writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  const robotsPath = join(dist, 'robots.txt');
  if (existsSync(robotsPath)) {
    const robots = readFileSync(robotsPath, 'utf8').replace(/^Sitemap:.*$/gm, '').trimEnd();
    writeFileSync(robotsPath, `${robots}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  }
}

// GitHub Pages (y hosts similares) sirven 404.html para rutas desconocidas:
// la app arranca y muestra su propia página «no encontrada».
writeFileSync(
  join(dist, '404.html'),
  template.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'),
);

console.log(`[seo] ${routes.length} rutas generadas${siteUrl ? ` · sitemap para ${siteUrl}` : ''}.`);
