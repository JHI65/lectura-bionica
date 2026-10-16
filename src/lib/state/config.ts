// Configuración pública del cliente. Solo variables VITE_* (nunca secretos).

export const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{16}$/;
export const ADSENSE_SLOT_PATTERN = /^\d{6,20}$/;

/** Tamaño máximo por archivo, en MB. Único punto donde se define el límite. */
export const DEFAULT_MAX_FILE_MB = 20;

function parseMaxMb(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_FILE_MB;
}

/** Límites de Premium. Se aplican en el navegador: el archivo nunca llega a un servidor. */
export const PREMIUM_MAX_FILE_MB = 100;
export const BATCH_MAX_FILES = 20;

function parseTrialDays(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 7;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 90 ? parsed : 7;
}

export const config = {
  maxFileMb: parseMaxMb(import.meta.env.VITE_MAX_FILE_MB),
  adsenseClient: normalizeAdsense(import.meta.env.VITE_ADSENSE_CLIENT),
  adsenseSlot: normalizeSlot(import.meta.env.VITE_ADSENSE_SLOT),
  siteUrl: (import.meta.env.VITE_SITE_URL?.trim() || '').replace(/\/+$/, ''),
  // Firebase (cuentas y estado Premium). La apiKey de Firebase es pública por diseño:
  // la seguridad la dan las reglas de Firestore y la verificación en las funciones.
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '',
    functionsRegion: import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || 'europe-west1',
    /** Solo para pruebas locales con los emuladores de Firebase. */
    useEmulators: import.meta.env.VITE_FIREBASE_EMULATORS === 'true',
  },
  premiumYearlyPriceLabel: import.meta.env.VITE_PREMIUM_YEARLY_PRICE_LABEL?.trim() || '24,99 €/año',
  /** Días de prueba gratuita que se anuncian. Debe coincidir con STRIPE_TRIAL_DAYS del backend. */
  premiumTrialDays: parseTrialDays(import.meta.env.VITE_PREMIUM_TRIAL_DAYS),
  premiumPriceLabel: import.meta.env.VITE_PREMIUM_PRICE_LABEL?.trim() || '2,99 €/mes',
  analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim() || '',
  /** Premium y cuentas (Firebase + Stripe). Apagado en el lanzamiento: ver docs/lanzamiento.md. */
  premiumEnabled: import.meta.env.VITE_PREMIUM_ENABLED === 'true',
  isProduction: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
};

function normalizeSlot(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return ADSENSE_SLOT_PATTERN.test(trimmed) ? trimmed : '';
}

function normalizeAdsense(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return ADSENSE_CLIENT_PATTERN.test(trimmed) ? trimmed : '';
}

/** URL absoluta de una ruta de la app, respetando el subdirectorio (BASE_URL). */
export function appUrl(path: string): string {
  const origin = config.siteUrl || `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/+$/, '')}`;
  return `${origin}${path}`;
}

export const isFirebaseConfigured = Boolean(config.firebase.apiKey && config.firebase.projectId && config.firebase.appId);
/** AdSense solo está configurado con cliente Y bloque válidos. */
export const isAdsenseConfigured = Boolean(config.adsenseClient && config.adsenseSlot);
