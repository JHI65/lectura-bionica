// Política de publicidad. Única fuente de verdad sobre si se muestra un anuncio.
//  - Premium verificado: nunca.
//  - Sin consentimiento decidido: nunca (no se carga ningún script de anuncios).
//  - Desarrollo sin AdSense configurado: placeholder claramente marcado.
//  - Producción sin AdSense configurado: nada.
//  - Consentimiento de anuncios: personalizados; si se rechazan: no personalizados.

import { config, isAdsenseConfigured } from './config';
import { getConsent } from './consent';

export type AdMode = 'off' | 'dev-placeholder' | 'live' | 'non-personalized';

export function resolveAdMode(isPremium: boolean): AdMode {
  if (isPremium) return 'off';
  const consent = getConsent();
  if (!isAdsenseConfigured) return config.isDev ? 'dev-placeholder' : 'off';
  if (config.isDev) return 'dev-placeholder';
  if (!consent.decided) return 'off';
  return consent.ads ? 'live' : 'non-personalized';
}

let scriptPromise: Promise<void> | null = null;
let loadedNonPersonalized: boolean | null = null;

/** Carga adsbygoogle.js una sola vez, según el consentimiento vigente. */
export function loadAdsenseScript(nonPersonalized: boolean): Promise<void> {
  if (!isAdsenseConfigured) return Promise.reject(new Error('AdSense no configurado'));
  if (scriptPromise && loadedNonPersonalized === nonPersonalized) return scriptPromise;

  loadedNonPersonalized = nonPersonalized;
  const w = window as unknown as { adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number } };
  if (nonPersonalized) {
    w.adsbygoogle = w.adsbygoogle ?? [];
    w.adsbygoogle.requestNonPersonalizedAds = 1;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-lb-adsense]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.lbAdsense = 'true';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsenseClient)}`;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('No se pudo cargar AdSense'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
