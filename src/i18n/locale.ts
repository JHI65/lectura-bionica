// Idiomas de la web. El idioma lo decide la URL: /en/… es inglés y el resto
// español. No hay redirección automática por idioma del navegador (es mala
// práctica para SEO y para quien comparte enlaces): hay un selector visible.

export type Locale = 'es' | 'en';

export const LOCALES: readonly Locale[] = ['es', 'en'];
export const DEFAULT_LOCALE: Locale = 'es';

export const HTML_LANG: Record<Locale, string> = { es: 'es', en: 'en' };
export const OG_LOCALE: Record<Locale, string> = { es: 'es_ES', en: 'en_US' };
export const BRAND: Record<Locale, string> = { es: 'Lectura biónica', en: 'Readably' };
/** Sufijo del nombre de archivo descargado: libro-lectura-bionica.epub / book-bionic-reading.epub */
export const FILE_SUFFIX: Record<Locale, string> = { es: 'lectura-bionica', en: 'bionic-reading' };
/** Para dar formato a números y tamaños. */
export const NUMBER_LOCALE: Record<Locale, string> = { es: 'es-ES', en: 'en-US' };

export function localeFromPath(pathname: string): Locale {
  return /^\/en(\/|$)/.test(pathname) ? 'en' : 'es';
}
