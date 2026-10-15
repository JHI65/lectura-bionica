// Analítica desacoplada. Solo se envía con consentimiento de analítica y a un
// endpoint propio configurado. Nunca se envía texto de libros, nombres de
// archivo ni contenido extraído: los parámetros están en una lista blanca.

import { config } from './config';
import { getConsent } from './consent';

export type AnalyticsEvent =
  | 'landing_view'
  | 'page_view'
  | 'conversion_started'
  | 'format_imported'
  | 'conversion_completed'
  | 'download_completed'
  | 'conversion_error'
  | 'returning_visit'
  | 'premium_checkout_started'
  | 'premium_canceled';

type ParamValue = string | number | boolean;

const ALLOWED_PARAMS = new Set(['format', 'intensity', 'error_code', 'plan', 'bionic', 'returning', 'page', 'source']);
const ALLOWED_VALUES: Record<string, ReadonlySet<string>> = {
  format: new Set(['epub', 'pdf']),
  error_code: new Set([
    'UNSUPPORTED_TYPE', 'FILE_TOO_LARGE', 'EMPTY_FILE', 'EPUB_INVALID', 'EPUB_PROTECTED', 'EPUB_NO_CONTENT',
    'PDF_DAMAGED', 'PDF_PROTECTED', 'PDF_NO_TEXT', 'EXPORT_FAILED', 'EXPORT_VERIFY_FAILED', 'RESOURCE_LIMIT', 'UNKNOWN',
  ]),
  intensity: new Set(['suave', 'media', 'alta']),
  plan: new Set(['premium']),
};

/**
 * Fuente de adquisición: solo el dominio del referrer o el valor de utm_source,
 * saneado. Nunca la URL completa (podría contener datos personales).
 */
export function acquisitionSource(referrer: string, search: string, ownHost: string): string {
  const utm = new URLSearchParams(search).get('utm_source');
  if (utm) return utm.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'directo';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host && host !== ownHost ? host.slice(0, 60) : 'directo';
  } catch {
    return 'directo';
  }
}

export function sanitizeParams(params: Record<string, ParamValue>): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAMS.has(key)) continue;
    if (typeof value === 'string' && ALLOWED_VALUES[key] && !ALLOWED_VALUES[key].has(value)) continue;
    out[key] = value;
  }
  return out;
}

export function track(event: AnalyticsEvent, params: Record<string, ParamValue> = {}): void {
  if (!getConsent().analytics) return;
  const payload = { event, params: sanitizeParams(params), ts: Date.now(), path: window.location.pathname };

  if (!config.analyticsEndpoint) {
    if (config.isDev) console.debug('[analytics]', payload);
    return;
  }
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(config.analyticsEndpoint, new Blob([body], { type: 'application/json' }));
    } else {
      void fetch(config.analyticsEndpoint, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  } catch {
    // La analítica nunca debe romper la aplicación.
  }
}

const VISITS_KEY = 'lb:visits';

/**
 * Cuenta visitas con un contador local, sin identificador de usuario.
 * Devuelve true si no es la primera. Llamar solo con consentimiento de analítica.
 */
export function registerVisit(): boolean {
  try {
    const previous = Number(window.localStorage.getItem(VISITS_KEY) ?? '0') || 0;
    window.localStorage.setItem(VISITS_KEY, String(previous + 1));
    return previous > 0;
  } catch {
    return false;
  }
}
