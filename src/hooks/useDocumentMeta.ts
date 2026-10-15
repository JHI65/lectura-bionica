// Título, descripción, canonical, hreflang e idioma por ruta. El HTML estático
// generado en build (scripts/seo-build.mjs) lleva los mismos valores para los
// rastreadores; este hook los mantiene al navegar dentro de la app.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { alternatesFor, findByPath } from '../content/routes';
import { BRAND, DEFAULT_LOCALE, HTML_LANG, OG_LOCALE, localeFromPath } from '../i18n/locale';
import { config } from '../lib/state/config';

interface Overrides {
  title?: string;
  description?: string;
  noindex?: boolean;
}

/** URL pública final de una ruta: cada ruta es una carpeta, con barra final. */
export function publicUrl(path: string): string {
  return `${config.siteUrl}${path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`}`;
}

export function useDocumentMeta(overrides: Overrides = {}) {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);
  const match = findByPath(pathname);
  const route = match?.entry[match.locale];
  const brand = BRAND[locale];

  const title = overrides.title ?? route?.title ?? brand;
  const description = overrides.description ?? route?.description ?? '';
  const noindex = overrides.noindex ?? match?.entry.noindex ?? false;
  const id = match?.entry.id;

  useEffect(() => {
    // La marca no se repite si el título ya la contiene.
    const hasBrand = title.toLowerCase().includes(brand.toLowerCase());
    document.title = hasBrand ? title : `${title} · ${brand}`;
    document.documentElement.lang = HTML_LANG[locale];

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', OG_LOCALE[locale]);
    setMeta('property', 'og:site_name', brand);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    if (config.siteUrl && route) {
      setMeta('property', 'og:url', publicUrl(route.path));
      setLink('canonical', publicUrl(route.path));
    }

    // hreflang: cada versión enlaza a las demás y a sí misma; x-default → español.
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    if (config.siteUrl && id) {
      const alternates = alternatesFor(id);
      if (alternates.length > 1) {
        for (const alt of alternates) addAlternate(alt.locale, publicUrl(alt.path));
        const fallback = alternates.find((a) => a.locale === DEFAULT_LOCALE) ?? alternates[0];
        addAlternate('x-default', publicUrl(fallback.path));
      }
    }
  }, [title, description, noindex, locale, brand, route, id]);
}

function addAlternate(hreflang: string, href: string) {
  const el = document.createElement('link');
  el.rel = 'alternate';
  el.hreflang = hreflang;
  el.href = href;
  document.head.appendChild(el);
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
