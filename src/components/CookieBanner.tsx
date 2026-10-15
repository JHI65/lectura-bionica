// Banner no bloqueante y compacto. Por defecto no hay consentimiento opcional.
// Rechazar y aceptar tienen el mismo peso visual y están a un clic. Las opciones
// por categoría quedan plegadas para no tapar la herramienta en pantallas pequeñas.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OPEN_COOKIES_EVENT, getConsent, saveConsent } from '../lib/state/consent';
import { useConsent } from '../hooks/useConsent';
import { useI18n } from '../i18n/useI18n';
import { btnPrimary, btnSecondary, linkBtn } from './ui';

export function CookieBanner() {
  const { t, href } = useI18n();
  const c = t.cookies;
  const consent = useConsent();
  const [forced, setForced] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const open = () => {
      const current = getConsent();
      setAnalytics(current.analytics);
      setAds(current.ads);
      setExpanded(true);
      setForced(true);
    };
    window.addEventListener(OPEN_COOKIES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIES_EVENT, open);
  }, []);

  if (consent.decided && !forced) return null;

  const save = (values: { analytics: boolean; ads: boolean }) => {
    const hadAds = getConsent().ads;
    saveConsent(values);
    setForced(false);
    setExpanded(false);
    // Revocar la publicidad requiere descargar los scripts ya cargados.
    if (hadAds && !values.ads) window.location.reload();
  };

  return (
    <section
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:p-5"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="flex-1 text-sm leading-relaxed text-ink-soft">
          <h2 id="cookie-title" className="text-sm font-semibold text-ink">
            {c.title}
          </h2>
          <p className="mt-0.5">
            {c.text}{' '}
            <Link className={linkBtn} to={href('cookies')}>
              {c.more}
            </Link>
            {' · '}
            <button
              type="button"
              className={linkBtn}
              aria-expanded={expanded}
              aria-controls="cookie-options"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? c.hide : c.choose}
            </button>
          </p>

          {expanded && (
            <fieldset id="cookie-options" className="mt-2 flex flex-wrap gap-x-6">
              <legend className="sr-only">{c.legend}</legend>
              <label className="flex min-h-[44px] items-center gap-2">
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                {c.analytics}
              </label>
              <label className="flex min-h-[44px] items-center gap-2">
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={ads} onChange={(e) => setAds(e.target.checked)} />
                {c.ads}
              </label>
            </fieldset>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
          <button type="button" className={`${btnSecondary} px-3 md:px-5`} onClick={() => save({ analytics: false, ads: false })}>
            {c.reject}
          </button>
          {expanded && (
            <button type="button" className={`${btnSecondary} px-3 md:px-5`} onClick={() => save({ analytics, ads })}>
              {c.save}
            </button>
          )}
          <button type="button" className={`${btnPrimary} px-3 md:px-5`} onClick={() => save({ analytics: true, ads: true })}>
            {c.accept}
          </button>
        </div>
      </div>
    </section>
  );
}
