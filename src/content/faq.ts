import faqData from './faq.json';
import { config } from '../lib/state/config';
import type { Locale } from '../i18n/locale';

interface FaqItem {
  id: string;
  premium?: boolean;
  /** `aPremium`: respuesta alternativa cuando Premium está activo (solo en español). */
  es: { q: string; a: string; aPremium?: string };
  en: { q: string; a: string };
}

/** Preguntas frecuentes en `locale`. Las de Premium solo aparecen si Premium está activo. */
export function faqFor(locale: Locale): Array<{ q: string; a: string }> {
  return (faqData as FaqItem[])
    .filter((item) => !item.premium || config.premiumEnabled)
    .map((item) => {
      const answer = locale === 'es' && config.premiumEnabled ? (item.es.aPremium ?? item.es.a) : item[locale].a;
      return { q: item[locale].q, a: answer.replace('{maxMb}', String(config.maxFileMb)) };
    });
}
