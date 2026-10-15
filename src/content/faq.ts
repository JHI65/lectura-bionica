import faqData from './faq.json';
import { config } from '../lib/state/config';
import type { Locale } from '../i18n/locale';

interface FaqItem {
  id: string;
  premium?: boolean;
  es: { q: string; a: string };
  en: { q: string; a: string };
}

/** Preguntas frecuentes en `locale`. Las de Premium solo aparecen si Premium está activo. */
export function faqFor(locale: Locale): Array<{ q: string; a: string }> {
  return (faqData as FaqItem[])
    .filter((item) => !item.premium || config.premiumEnabled)
    .map((item) => ({ q: item[locale].q, a: item[locale].a.replace('{maxMb}', String(config.maxFileMb)) }));
}
