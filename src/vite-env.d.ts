/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_ADSENSE_SLOT?: string;
  readonly VITE_PREMIUM_YEARLY_PRICE_LABEL?: string;
  readonly VITE_PREMIUM_TRIAL_DAYS?: string;
  readonly VITE_PREMIUM_MAX_FILE_MB?: string;
  readonly VITE_PREMIUM_ENABLED?: string;
  readonly VITE_MAX_FILE_MB?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PREMIUM_PRICE_LABEL?: string;
  readonly VITE_ANALYTICS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
