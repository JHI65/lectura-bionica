// Configuración pública del cliente. Solo variables VITE_* (nunca secretos).

export const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{16}$/;
export const ADSENSE_SLOT_PATTERN = /^\d{6,20}$/;

export const config = {
  adsenseClient: normalizeAdsense(import.meta.env.VITE_ADSENSE_CLIENT),
  adsenseSlot: normalizeSlot(import.meta.env.VITE_ADSENSE_SLOT),
  siteUrl: (import.meta.env.VITE_SITE_URL?.trim() || '').replace(/\/+$/, ''),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '',
  premiumPriceLabel: import.meta.env.VITE_PREMIUM_PRICE_LABEL?.trim() || '2,99 €/mes',
  analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim() || '',
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

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
/** AdSense solo está configurado con cliente Y bloque válidos. */
export const isAdsenseConfigured = Boolean(config.adsenseClient && config.adsenseSlot);
