// Banner no bloqueante. Por defecto no hay consentimiento opcional marcado.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OPEN_COOKIES_EVENT, getConsent, saveConsent } from '../lib/state/consent';
import { useConsent } from '../hooks/useConsent';
import { btnPrimary, btnSecondary, linkBtn } from './ui';

export function CookieBanner() {
  const consent = useConsent();
  const [forced, setForced] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const open = () => {
      const current = getConsent();
      setAnalytics(current.analytics);
      setAds(current.ads);
      setForced(true);
    };
    window.addEventListener(OPEN_COOKIES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIES_EVENT, open);
  }, []);

  if (consent.decided && !forced) return null;

  const save = (values: { analytics: boolean; ads: boolean }) => {
    saveConsent(values);
    setForced(false);
  };

  return (
    <section
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-6"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 text-sm leading-relaxed text-ink-soft">
          <h2 id="cookie-title" className="text-base font-semibold text-ink">
            Tu privacidad, tu elección
          </h2>
          <p className="mt-1">
            Tus documentos nunca salen de tu dispositivo. Las cookies necesarias funcionan siempre. Puedes aceptar o rechazar la analítica y la publicidad: sin tu elección no se cargan.{' '}
            <Link className={linkBtn} to="/cookies">Más información</Link>
          </p>
          <fieldset className="mt-3 flex flex-wrap gap-4">
            <legend className="sr-only">Cookies opcionales</legend>
            <label className="flex min-h-[44px] items-center gap-2">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              Analítica anónima
            </label>
            <label className="flex min-h-[44px] items-center gap-2">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={ads} onChange={(e) => setAds(e.target.checked)} />
              Publicidad personalizada
            </label>
          </fieldset>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <button type="button" className={btnSecondary} onClick={() => save({ analytics: false, ads: false })}>
            Rechazar opcionales
          </button>
          <button type="button" className={btnSecondary} onClick={() => save({ analytics, ads })}>
            Guardar mi elección
          </button>
          <button type="button" className={btnPrimary} onClick={() => save({ analytics: true, ads: true })}>
            Aceptar todo
          </button>
        </div>
      </div>
    </section>
  );
}
