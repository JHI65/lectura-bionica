// Post-build de SEO. Tras `vite build`:
//  - genera dist/<ruta>/index.html para cada página y cada idioma, con título,
//    descripción, canonical, hreflang, Open Graph y datos estructurados propios,
//    para que los rastreadores los lean sin ejecutar JS;
//  - genera sitemap.xml con las alternativas de idioma (xhtml:link);
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
const maxMb = Number(process.env.VITE_MAX_FILE_MB || env.VITE_MAX_FILE_MB) || 50;

const LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';
const BRAND = { es: 'Readably', en: 'Readably' };
const OG_LOCALE = { es: 'es_ES', en: 'en_US' };
const APP_NAME = { es: 'Conversor PDF/EPUB a Lectura Biónica', en: 'PDF/EPUB to Bionic Reading Converter' };
const APP_DESCRIPTION = {
  es: 'Convierte EPUB y PDF con texto a lectura biónica personalizable, procesados en tu navegador.',
  en: 'Convert EPUB and PDF files with text to customizable bionic-style reading, processed in your browser.',
};

// Las rutas que dependen de Premium solo se publican si está activado (y solo en español).
const routes = JSON.parse(readFileSync(join(root, 'src/content/routes.json'), 'utf8')).filter(
  (route) => route.requires !== 'premium' || premiumEnabled,
);
const faqData = JSON.parse(readFileSync(join(root, 'src/content/faq.json'), 'utf8'));
const template = readFileSync(join(dist, 'index.html'), 'utf8');

if (!siteUrl) {
  console.warn('[seo] VITE_SITE_URL no está definida: canonical, hreflang, Open Graph y sitemap no se generan. Defínela antes de publicar.');
}

// GitHub Pages (y la mayoría de hosts estáticos) sirven cada ruta como carpeta y
// redirigen /ruta → /ruta/. La URL canónica es la final, con barra.
const canonicalUrl = (path) => `${siteUrl}${path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`}`;
const escape = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const entriesFor = (route) => LOCALES.filter((locale) => route[locale]).map((locale) => ({ locale, ...route[locale] }));

function defaultAlternate(alternates) {
  return alternates.find((a) => a.locale === DEFAULT_LOCALE) ?? alternates[0];
}

// Datos estructurados de la portada: aplicación web gratuita + preguntas frecuentes.
function homeJsonLd(locale, path) {
  const faq = faqData.filter((item) => !item.premium || (premiumEnabled && locale === 'es'));
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: APP_NAME[locale],
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: locale,
      isAccessibleForFree: true,
      description: APP_DESCRIPTION[locale],
      ...(siteUrl ? { url: canonicalUrl(path) } : {}),
      offers: { '@type': 'Offer', price: '0', priceCurrency: locale === 'en' ? 'USD' : 'EUR' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item[locale].q,
        acceptedAnswer: { '@type': 'Answer', text: (locale === 'es' && premiumEnabled ? (item.es.aPremium ?? item.es.a) : item[locale].a).replace('{maxMb}', String(maxMb)) },
      })),
    },
  ];
  // </ en JSON dentro de <script> podría cerrar la etiqueta: se escapa.
  return data
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');
}

function pageHtml(route, locale) {
  const meta = route[locale];
  const brand = BRAND[locale];
  const hasBrand = meta.title.toLowerCase().includes(brand.toLowerCase());
  const title = hasBrand ? meta.title : `${meta.title} · ${brand}`;
  const canonical = siteUrl ? canonicalUrl(meta.path) : '';
  const alternates = entriesFor(route);

  const head = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    `<meta name="robots" content="${route.noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(brand)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[locale]}" />`,
    canonical ? `<meta property="og:url" content="${escape(canonical)}" />` : '',
    siteUrl ? `<meta property="og:image" content="${escape(`${siteUrl}/og-image.png`)}" />` : '',
    canonical ? `<link rel="canonical" href="${escape(canonical)}" />` : '',
    // hreflang: cada versión enlaza a las demás y a sí misma; x-default → español.
    ...(siteUrl && alternates.length > 1
      ? [
          ...alternates.map((a) => `<link rel="alternate" hreflang="${a.locale}" href="${escape(canonicalUrl(a.path))}" />`),
          `<link rel="alternate" hreflang="x-default" href="${escape(canonicalUrl(defaultAlternate(alternates).path))}" />`,
        ]
      : []),
    route.id === 'home' ? homeJsonLd(locale, meta.path) : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${locale}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta property="og:site_name"[^>]*>/, '')
    .replace(/<meta property="og:locale"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`);
}

let pages = 0;
for (const route of routes) {
  for (const { locale, path } of entriesFor(route)) {
    const html = pageHtml(route, locale);
    const dir = path === '/' ? dist : join(dist, path.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    pages++;
  }
}

if (siteUrl) {
  const urls = routes
    .filter((r) => !r.noindex)
    .flatMap((route) => {
      const alternates = entriesFor(route);
      const links =
        alternates.length > 1
          ? [
              ...alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.locale}" href="${escape(canonicalUrl(a.path))}"/>`),
              `    <xhtml:link rel="alternate" hreflang="x-default" href="${escape(canonicalUrl(defaultAlternate(alternates).path))}"/>`,
            ].join('\n')
          : '';
      return alternates.map(
        (self) => `  <url>\n    <loc>${escape(canonicalUrl(self.path))}</loc>${links ? `\n${links}` : ''}\n  </url>`,
      );
    })
    .join('\n');
  writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
  );
  const robotsPath = join(dist, 'robots.txt');
  if (existsSync(robotsPath)) {
    const robots = readFileSync(robotsPath, 'utf8').replace(/^Sitemap:.*$/gm, '').trimEnd();
    writeFileSync(robotsPath, `${robots}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  }
}

// GitHub Pages (y hosts similares) sirven 404.html para rutas desconocidas:
// la app arranca y muestra su propia página «no encontrada».
writeFileSync(join(dist, '404.html'), template.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'));

console.log(`[seo] ${pages} páginas generadas${siteUrl ? ` · sitemap para ${siteUrl}` : ''}.`);
