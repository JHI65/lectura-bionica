// Consentimiento de cookies y tecnologías opcionales (analítica y publicidad).
// Por defecto no hay consentimiento: ni anuncios ni analítica hasta decidir.

const KEY = 'lb:consent:v1';
const CONSENT_VERSION = 1;

export interface ConsentState {
  decided: boolean;
  analytics: boolean;
  ads: boolean; // true = publicidad personalizada; false = no personalizada
  decidedAt?: string;
}

export const NO_CONSENT: ConsentState = { decided: false, analytics: false, ads: false };

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: ConsentState | null = null;

function read(): ConsentState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return NO_CONSENT;
    const parsed = JSON.parse(raw) as Partial<ConsentState> & { version?: number };
    if (parsed.version !== CONSENT_VERSION) return NO_CONSENT;
    return {
      decided: parsed.decided === true,
      analytics: parsed.analytics === true,
      ads: parsed.ads === true,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : undefined,
    };
  } catch {
    return NO_CONSENT;
  }
}

export function getConsent(): ConsentState {
  if (!cache) cache = read();
  return cache;
}

export function saveConsent(input: { analytics: boolean; ads: boolean }): void {
  const next: ConsentState = {
    decided: true,
    analytics: input.analytics,
    ads: input.ads,
    decidedAt: new Date().toISOString(),
  };
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: CONSENT_VERSION, ...next }));
  } catch {
    // Sin almacenamiento el consentimiento dura solo la sesión actual.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeConsent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const OPEN_COOKIES_EVENT = 'lb:open-cookie-preferences';

/** Pide al banner que vuelva a mostrarse (enlace «Preferencias de cookies»). */
export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(OPEN_COOKIES_EVENT));
}
