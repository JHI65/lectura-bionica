// Política de publicidad. Única fuente de verdad sobre si se muestra un anuncio.
//  - Premium verificado: nunca.
//  - Sin consentimiento de publicidad: nunca. No se carga ningún script de
//    anuncios, ni siquiera "no personalizados": en la UE también usan
//    cookies/almacenamiento del dispositivo y requieren consentimiento.
//  - Desarrollo sin AdSense configurado: placeholder claramente marcado.
//  - Producción sin AdSense configurado: nada.

import { config, isAdsenseConfigured } from './config';
import { getConsent } from './consent';

export type AdMode = 'off' | 'dev-placeholder' | 'live';

export function resolveAdMode(isPremium: boolean): AdMode {
  if (isPremium) return 'off';
  const consent = getConsent();
  if (!isAdsenseConfigured) return config.isDev ? 'dev-placeholder' : 'off';
  if (config.isDev) return 'dev-placeholder';
  return consent.decided && consent.ads ? 'live' : 'off';
}

let scriptPromise: Promise<void> | null = null;

/** Carga adsbygoogle.js una sola vez. Solo debe llamarse con modo 'live'. */
export function loadAdsenseScript(): Promise<void> {
  if (!isAdsenseConfigured) return Promise.reject(new Error('AdSense no configurado'));
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
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
