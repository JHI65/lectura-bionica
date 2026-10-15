import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { CookieBanner } from './CookieBanner';
import { openCookiePreferences } from '../lib/state/consent';
import { usePremium } from '../hooks/usePremium';
import { config, isSupabaseConfigured } from '../lib/state/config';
import { useConsent } from '../hooks/useConsent';
import { acquisitionSource, registerVisit, track } from '../lib/state/analytics';
import { alternatesFor, findByPath, pathFor } from '../content/routes';
import { useI18n } from '../i18n/useI18n';
import type { Locale } from '../i18n/locale';

const NAV_IDS = ['home', 'guide-what', 'guide-epub', 'guide-pdf'] as const;
const FOOTER_GUIDES = ['guide-epub', 'guide-pdf', 'guide-typography', 'guide-accessibility', 'guide-ocr', 'guide-troubleshoot'] as const;

const navClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-[44px] shrink-0 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
    isActive ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
  }`;

/** Ruta equivalente en otro idioma; si no existe, la portada de ese idioma. */
function counterpart(pathname: string, target: Locale): string {
  const match = findByPath(pathname);
  if (match) {
    const alt = alternatesFor(match.entry.id).find((a) => a.locale === target);
    if (alt) return alt.path === '/en' ? '/en/' : alt.path;
  }
  return pathFor('home', target);
}

export function Layout() {
  const { pathname } = useLocation();
  const { locale, t, brand, href } = useI18n();
  const premium = usePremium();
  const consent = useConsent();
  const visitCounted = useRef(false);
  const otherLocale: Locale = locale === 'es' ? 'en' : 'es';
  const showPremium = config.premiumEnabled && locale === 'es';

  // Visita recurrente: una vez por sesión y solo si se aceptó la analítica
  // (el contador local no existe sin ese consentimiento).
  useEffect(() => {
    if (!consent.analytics || visitCounted.current) return;
    visitCounted.current = true;
    if (registerVisit()) track('returning_visit', { returning: true });
  }, [consent.analytics]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    track('page_view', { lang: locale });
    if (findByPath(pathname)?.entry.id === 'home') {
      track('landing_view', {
        lang: locale,
        source: acquisitionSource(document.referrer, window.location.search, window.location.hostname),
      });
    }
  }, [pathname, locale]);

  const footerLink = 'min-h-[44px] content-center text-ink-soft hover:text-brand';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        {t.skipToContent}
      </a>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to={href('home')} className="mr-auto flex min-h-[44px] items-center gap-2 rounded-lg font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            {/* Decorativo: el nombre al lado ya lo describe. */}
            <img src={`${import.meta.env.BASE_URL}logo.png`} width={36} height={36} alt="" className="h-9 w-9" />
            {brand}
          </Link>
          {/* El selector de idioma va en la fila del logo: dentro del menú con scroll
              horizontal quedaba cortado en pantallas estrechas. */}
          <Link
            to={counterpart(pathname, otherLocale)}
            hrefLang={otherLocale}
            lang={otherLocale}
            aria-label={t.language.switchAria}
            className="order-2 min-h-[44px] shrink-0 content-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:order-3"
          >
            {t.language.switchLabel}
          </Link>
          <nav aria-label={t.nav.aria} className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto">
            {NAV_IDS.map((id) => (
              <NavLink key={id} to={href(id)} end={id === 'home'} className={navClass}>
                {t.nav[id]}
              </NavLink>
            ))}
            {showPremium && (
              <NavLink to={pathFor('premium', 'es')} className={navClass}>
                {t.nav.premium}
              </NavLink>
            )}
            {showPremium && isSupabaseConfigured && (
              <NavLink to={pathFor('account', 'es')} className={navClass}>
                {premium.status === 'premium' ? t.nav.accountPremium : t.nav.account}
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
            <p className="font-semibold">{brand}</p>
            <p className="mt-2 text-ink-soft">{t.footer.tagline}</p>
          </div>
          <nav aria-label={t.footer.legalAria} className="flex flex-col gap-2">
            <p className="font-semibold">{t.footer.legalTitle}</p>
            <Link className={footerLink} to={href('privacy')}>{t.footer.privacy}</Link>
            <Link className={footerLink} to={href('cookies')}>{t.footer.cookies}</Link>
            <Link className={footerLink} to={href('terms')}>{t.footer.terms}</Link>
            <Link className={footerLink} to={href('legal')}>{t.footer.legal}</Link>
            <button type="button" onClick={openCookiePreferences} className="min-h-[44px] text-left text-ink-soft hover:text-brand">
              {t.footer.cookiePrefs}
            </button>
          </nav>
          <nav aria-label={t.footer.guidesAria} className="flex flex-col gap-2">
            <p className="font-semibold">{t.footer.guidesTitle}</p>
            {FOOTER_GUIDES.map((id) => (
              <Link key={id} className={footerLink} to={href(id)}>
                {t.footer.guideLinks[id]}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ink-soft">{t.footer.copyright(new Date().getFullYear(), brand)}</p>
      </footer>

      <CookieBanner />
    </div>
  );
}
