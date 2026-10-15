import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PremiumPage } from './pages/PremiumPage';
import { GuidePage, LegalPage, NotFoundPage } from './pages/ContentPages';
import { SEO_PAGES } from './content/seo-pages';
import { LEGAL_DOCS } from './content/legal';

// El conversor (epub.js, pdf.js) y la cuenta se cargan solo cuando se visitan.
const ConvertPage = lazy(() => import('./pages/ConvertPage').then((m) => ({ default: m.ConvertPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));

function RouteFallback() {
  return (
    <div role="status" className="mx-auto max-w-md px-4 py-20 text-center text-ink-soft">
      Cargando…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="convertir" element={<ConvertPage />} />
        <Route path="premium" element={<PremiumPage />} />
        <Route path="cuenta" element={<AccountPage />} />
        {SEO_PAGES.map((page) => (
          <Route key={page.path} path={page.path.slice(1)} element={<GuidePage />} />
        ))}
        {LEGAL_DOCS.map((doc) => (
          <Route key={doc.path} path={doc.path.slice(1)} element={<LegalPage />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
