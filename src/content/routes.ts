// Rutas de la web por idioma. La fuente de verdad es routes.json, que también
// lee el post-build (scripts/seo-build.mjs). Cada ruta tiene un `id` estable que
// une sus versiones en cada idioma (para enlaces internos y hreflang).
import routesData from './routes.json';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/locale';

export interface RouteLocale {
  path: string;
  title: string;
  description: string;
}

export interface RouteEntry {
  id: string;
  noindex?: boolean;
  requires?: 'premium';
  es: RouteLocale;
  en?: RouteLocale;
}

export const ROUTES = routesData as RouteEntry[];

export type RouteId = string;

/** Quita la barra final salvo en la raíz: /privacidad/ → /privacidad. */
export function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function routeLocale(id: RouteId, locale: Locale): RouteLocale | undefined {
  const entry = ROUTES.find((r) => r.id === id);
  return entry?.[locale];
}

/** Ruta de `id` en `locale`; si no existe en ese idioma, la del español. */
export function pathFor(id: RouteId, locale: Locale): string {
  return routeLocale(id, locale)?.path ?? routeLocale(id, DEFAULT_LOCALE)?.path ?? '/';
}

export interface RouteMatch {
  entry: RouteEntry;
  locale: Locale;
}

export function findByPath(pathname: string): RouteMatch | undefined {
  const path = normalizePath(pathname);
  for (const entry of ROUTES) {
    for (const locale of LOCALES) {
      if (entry[locale]?.path === path) return { entry, locale };
    }
  }
  return undefined;
}

/** Versiones disponibles de una ruta, para hreflang y el selector de idioma. */
export function alternatesFor(id: RouteId): Array<{ locale: Locale; path: string }> {
  const entry = ROUTES.find((r) => r.id === id);
  if (!entry) return [];
  return LOCALES.filter((l) => entry[l]).map((l) => ({ locale: l, path: entry[l]!.path }));
}
