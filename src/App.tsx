import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { GuidePage, LegalPage, NotFoundPage } from './pages/ContentPages';
import { ROUTES } from './content/routes';
import { LOCALES } from './i18n/locale';
import { config } from './lib/state/config';

// El conversor (epub.js, pdf.js) y la cuenta se cargan solo cuando se visitan.
const PremiumPage = lazy(() => import('./pages/PremiumPage').then((m) => ({ default: m.PremiumPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const ConvertPage = lazy(() => import('./pages/ConvertPage').then((m) => ({ default: m.ConvertPage })));

function RouteFallback() {
  return (
    <div role="status" className="mx-auto max-w-md px-4 py-20 text-center text-ink-soft">
      …
    </div>
  );
}

const GUIDE_IDS = new Set(['guide-what', 'guide-epub', 'guide-pdf', 'guide-typography', 'guide-accessibility', 'guide-ocr', 'guide-troubleshoot']);
const LEGAL_IDS = new Set(['privacy', 'cookies', 'terms', 'legal']);

function elementFor(id: string) {
  if (id === 'home') return <HomePage />;
  if (id === 'convert') return <ConvertPage />;
  if (id === 'premium') return config.premiumEnabled ? <PremiumPage /> : null;
  if (id === 'account') return config.premiumEnabled ? <AccountPage /> : null;
  if (GUIDE_IDS.has(id)) return <GuidePage />;
  if (LEGAL_IDS.has(id)) return <LegalPage />;
  return null;
}

/** Una ruta por cada idioma disponible de cada entrada de routes.json. */
const PAGE_ROUTES = ROUTES.flatMap((entry) =>
  LOCALES.filter((locale) => entry[locale]).flatMap((locale) => {
    const element = elementFor(entry.id);
    if (!element) return [];
    const path = entry[locale]!.path;
    return [{ key: `${locale}:${entry.id}`, path: path === '/' ? undefined : path.slice(1), index: path === '/', element }];
  }),
);

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          {PAGE_ROUTES.map((r) =>
            r.index ? <Route key={r.key} index element={r.element} /> : <Route key={r.key} path={r.path} element={r.element} />,
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
