// Título, descripción y canonical por ruta. El HTML estático generado en build
// (scripts/seo-build.mjs) lleva los mismos valores para los rastreadores.
import { useEffect } from 'react';
import routes from '../content/routes.json';
import { config } from '../lib/state/config';

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

/**
 * Las URLs publicadas terminan en barra (/privacidad/) porque cada ruta es una
 * carpeta. Las rutas internas no: se normaliza para que ambas coincidan.
 */
export function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function metaFor(path: string): RouteMeta | undefined {
  return (routes as RouteMeta[]).find((r) => r.path === normalizePath(path));
}

export function useDocumentMeta(rawPath: string, overrides: Partial<Pick<RouteMeta, 'title' | 'description'>> = {}) {
  const path = normalizePath(rawPath);
  useEffect(() => {
    const meta = metaFor(path);
    const title = overrides.title ?? meta?.title ?? 'Lectura biónica';
    const description = overrides.description ?? meta?.description ?? '';
    document.title = /lectura bi[oó]nica/i.test(title) ? title : `${title} · Lectura biónica`;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    if (config.siteUrl) {
      // Misma URL final que el sitemap: los hosts estáticos redirigen /ruta → /ruta/.
      const url = `${config.siteUrl}${path === '/' ? '/' : `${path}/`}`;
      setMeta('property', 'og:url', url);
      setLink('canonical', url);
    }
    setMeta('name', 'robots', meta?.noindex ? 'noindex, nofollow' : 'index, follow');
  }, [path, overrides.title, overrides.description]);
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
