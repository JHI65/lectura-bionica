// Espacio publicitario. Nunca se coloca dentro del texto leído ni junto a
// botones de conversión, y nunca se muestra a Premium verificado.
import { useEffect, useRef, useState } from 'react';
import { useConsent } from '../hooks/useConsent';
import { useI18n } from '../i18n/useI18n';
import { usePremium } from '../hooks/usePremium';
import { loadAdsenseScript, resolveAdMode } from '../lib/state/ads';
import { config } from '../lib/state/config';

export function AdSlot({ label, className = '' }: { label?: string; className?: string }) {
  const { t } = useI18n();
  const text = label ?? t.advertisement;
  const premium = usePremium();
  useConsent(); // se suscribe al consentimiento: el modo cambia al aceptar o rechazar el banner
  const isPremium = premium.status === 'premium';
  const mode = resolveAdMode(isPremium);
  const insRef = useRef<HTMLModElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mode !== 'live') return;
    let cancelled = false;
    loadAdsenseScript()
      .then(() => {
        if (cancelled || !insRef.current) return;
        try {
          const w = window as unknown as { adsbygoogle?: unknown[] };
          (w.adsbygoogle = w.adsbygoogle ?? []).push({});
        } catch {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (mode === 'off' || failed) return null;

  if (mode === 'dev-placeholder') {
    return (
      <aside
        aria-label={text}
        className={`rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-center text-xs text-amber-900 ${className}`}
      >
        <p className="font-semibold">{text}</p>
        <p>{t.adDevPlaceholder}</p>
      </aside>
    );
  }

  return (
    // Altura reservada: evita que el contenido salte cuando el anuncio carga.
    <aside aria-label={text} className={`min-h-[280px] ${className}`}>
      <p className="mb-1 text-center text-[11px] uppercase tracking-wide text-ink-soft">{text}</p>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={config.adsenseClient}
        data-ad-slot={config.adsenseSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
