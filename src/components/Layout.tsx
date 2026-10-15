import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { CookieBanner } from './CookieBanner';
import { openCookiePreferences } from '../lib/state/consent';
import { usePremium } from '../hooks/usePremium';
import { config, isSupabaseConfigured } from '../lib/state/config';
import { useConsent } from '../hooks/useConsent';
import { acquisitionSource, registerVisit, track } from '../lib/state/analytics';

const NAV = [
  { to: '/convertir', label: 'Convertir' },
  { to: '/que-es-la-lectura-bionica', label: '¿Qué es?' },
  { to: '/convertir-epub-a-lectura-bionica', label: 'EPUB' },
  { to: '/convertir-pdf-a-lectura-bionica', label: 'PDF' },
  ...(config.premiumEnabled ? [{ to: '/premium', label: 'Premium' }] : []),
];

export function Layout() {
  const { pathname } = useLocation();
  const premium = usePremium();
  const consent = useConsent();
  const visitCounted = useRef(false);

  // Visita recurrente: una vez por sesión y solo si se aceptó la analítica
  // (el contador local no existe sin ese consentimiento).
  useEffect(() => {
    if (!consent.analytics || visitCounted.current) return;
    visitCounted.current = true;
    if (registerVisit()) track('returning_visit', { returning: true });
  }, [consent.analytics]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    track('page_view');
    if (pathname === '/') {
      track('landing_view', { source: acquisitionSource(document.referrer, window.location.search, window.location.hostname) });
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Saltar al contenido
      </a>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="flex min-h-[44px] items-center gap-2 rounded-lg font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            {/* Decorativo: el nombre al lado ya lo describe. */}
            <img src={`${import.meta.env.BASE_URL}logo.png`} width={36} height={36} alt="" className="h-9 w-9" />
            Lectura biónica
          </Link>
          <nav aria-label="Principal" className="-mx-1 flex w-full gap-1 overflow-x-auto sm:w-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `min-h-[44px] shrink-0 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isActive ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {config.premiumEnabled && isSupabaseConfigured && (
              <NavLink
                to="/cuenta"
                className={({ isActive }) =>
                  `min-h-[44px] shrink-0 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isActive ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
                  }`
                }
              >
                {premium.status === 'premium' ? 'Mi cuenta · Premium' : 'Mi cuenta'}
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold">Lectura biónica</p>
            <p className="mt-2 text-ink-soft">
              Herramienta de personalización de la lectura. Tus documentos se procesan en tu dispositivo.
            </p>
          </div>
          <nav aria-label="Legal" className="flex flex-col gap-2">
            <p className="font-semibold">Legal</p>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/privacidad">Política de privacidad</Link>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/cookies">Política de cookies</Link>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/terminos">Condiciones de uso</Link>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/aviso-legal">Aviso legal</Link>
            <button type="button" onClick={openCookiePreferences} className="min-h-[44px] text-left text-ink-soft hover:text-brand">
              Preferencias de cookies
            </button>
          </nav>
          <nav aria-label="Guías" className="flex flex-col gap-2">
            <p className="font-semibold">Guías</p>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/convertir-epub-a-lectura-bionica">Convertir EPUB</Link>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/convertir-pdf-a-lectura-bionica">Convertir PDF</Link>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/personalizar-tipografia-para-leer">Personalizar la tipografía</Link>
            <Link className="min-h-[44px] content-center text-ink-soft hover:text-brand" to="/herramientas-accesibilidad-lectora">Herramientas de accesibilidad</Link>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ink-soft">
          © {new Date().getFullYear()} Lectura biónica. La lectura biónica es una herramienta de personalización visual y no tiene finalidad médica.
        </p>
      </footer>

      <CookieBanner />
    </div>
  );
}
