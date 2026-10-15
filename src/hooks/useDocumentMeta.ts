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

export function metaFor(path: string): RouteMeta | undefined {
  return (routes as RouteMeta[]).find((r) => r.path === path);
}

export function useDocumentMeta(path: string, overrides: Partial<Pick<RouteMeta, 'title' | 'description'>> = {}) {
  useEffect(() => {
    const meta = metaFor(path);
    const title = overrides.title ?? meta?.title ?? 'Lectura biónica';
    const description = overrides.description ?? meta?.description ?? '';
    document.title = `${title} · Lectura biónica`;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    if (config.siteUrl) {
      setMeta('property', 'og:url', `${config.siteUrl}${path}`);
      setLink('canonical', `${config.siteUrl}${path}`);
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
