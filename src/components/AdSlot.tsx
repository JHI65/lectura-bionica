// Espacio publicitario. Nunca se coloca dentro del texto leído ni junto a
// botones de conversión, y nunca se muestra a Premium verificado.
import { useEffect, useRef, useState } from 'react';
import { useConsent } from '../hooks/useConsent';
import { usePremium } from '../hooks/usePremium';
import { loadAdsenseScript, resolveAdMode } from '../lib/state/ads';
import { config } from '../lib/state/config';

export function AdSlot({ label = 'Publicidad', className = '' }: { label?: string; className?: string }) {
  const premium = usePremium();
  const consent = useConsent();
  const isPremium = premium.status === 'premium';
  const mode = resolveAdMode(isPremium);
  const insRef = useRef<HTMLModElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mode !== 'live' && mode !== 'non-personalized') return;
    let cancelled = false;
    loadAdsenseScript(mode === 'non-personalized')
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
    // `consent.ads` cambia el modo; `mode` ya lo refleja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, consent.decided]);

  if (mode === 'off' || failed) return null;

  if (mode === 'dev-placeholder') {
    return (
      <aside
        aria-label="Espacio publicitario de desarrollo"
        className={`rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-center text-xs text-amber-900 ${className}`}
      >
        <p className="font-semibold">Espacio publicitario de desarrollo</p>
        <p>{label}. No se muestra en producción. Configura VITE_ADSENSE_CLIENT y VITE_ADSENSE_SLOT.</p>
      </aside>
    );
  }

  return (
    <aside aria-label={label} className={`min-h-[100px] ${className}`}>
      <p className="mb-1 text-center text-[11px] uppercase tracking-wide text-ink-soft">{label}</p>
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
