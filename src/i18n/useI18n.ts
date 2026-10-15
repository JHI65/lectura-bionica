// Hook de idioma: el idioma sale de la URL (/en/… = inglés). Devuelve los
// textos, utilidades para construir enlaces internos y el nombre de la marca.
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { pathFor, type RouteId } from '../content/routes';
import { DICT, type Dict } from './dict';
import { BRAND, NUMBER_LOCALE, localeFromPath, type Locale } from './locale';

export interface I18n {
  locale: Locale;
  t: Dict;
  brand: string;
  numberLocale: string;
  /** Ruta interna de `id` en el idioma activo. */
  href: (id: RouteId) => string;
}

export function useI18n(): I18n {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);
  return useMemo(
    () => ({
      locale,
      t: DICT[locale],
      brand: BRAND[locale],
      numberLocale: NUMBER_LOCALE[locale],
      href: (id: RouteId) => pathFor(id, locale),
    }),
    [locale],
  );
}
