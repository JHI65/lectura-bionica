import faqData from './faq.json';
import { config } from '../lib/state/config';

interface FaqItem {
  q: string;
  a: string;
  premium?: boolean;
}

/** Preguntas frecuentes. Las de Premium solo aparecen si Premium está activo. */
export const FAQ: Array<{ q: string; a: string }> = (faqData as FaqItem[])
  .filter((item) => !item.premium || config.premiumEnabled)
  .map((item) => ({ q: item.q, a: item.a.replace('{maxMb}', String(config.maxFileMb)) }));
