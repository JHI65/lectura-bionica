import { Link, useLocation } from 'react-router-dom';
import { AdSlot } from '../components/AdSlot';
import { btnPrimary, card, linkBtn, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { LEGAL_DOCS } from '../content/legal';
import { SEO_PAGES } from '../content/seo-pages';

/** Página de guía: una intención de búsqueda por ruta, sin contenido duplicado. */
export function GuidePage() {
  const { pathname } = useLocation();
  const page = SEO_PAGES.find((p) => p.path === pathname);
  useDocumentMeta(pathname);

  if (!page) return <NotFoundPage />;

  const related = SEO_PAGES.filter((p) => p.path !== page.path).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-4">
        <h1 className={sectionTitle}>{page.h1}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">{page.intro}</p>
      </header>

      {page.sections.map((section) => (
        <section key={section.heading} className="space-y-4">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="leading-relaxed text-ink-soft">
              {p}
            </p>
          ))}
          {section.list && (
            <ul className="list-disc space-y-2 pl-6 leading-relaxed text-ink-soft">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className={`${card} flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <p className="font-medium">Pruébalo con tu propio documento. No necesitas registrarte.</p>
        <Link to={page.cta.to} className={btnPrimary}>
          {page.cta.label}
        </Link>
      </div>

      <nav aria-label="Otras guías" className="space-y-3">
        <h2 className="text-lg font-semibold">Otras guías</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {related.map((p) => (
            <li key={p.path}>
              <Link className={`${linkBtn} block rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium`} to={p.path}>
                {p.h1}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <AdSlot label="Publicidad" />
    </article>
  );
}

/** Documentos legales. Los datos del titular se rellenan en src/content/legal.ts. */
export function LegalPage() {
  const { pathname } = useLocation();
  const doc = LEGAL_DOCS.find((d) => d.path === pathname);
  useDocumentMeta(pathname);

  if (!doc) return <NotFoundPage />;

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className={sectionTitle}>{doc.title}</h1>
        <p className="text-sm text-ink-soft">Última revisión: {doc.updated}</p>
      </header>
      {doc.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="leading-relaxed text-ink-soft">
              {p}
            </p>
          ))}
          {section.list && (
            <ul className="list-disc space-y-2 pl-6 leading-relaxed text-ink-soft">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

export function NotFoundPage() {
  useDocumentMeta('/404', { title: 'Página no encontrada', description: 'La página que buscas no existe.' });
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
      <h1 className={sectionTitle}>Página no encontrada</h1>
      <p className="text-ink-soft">La dirección no existe o se ha movido.</p>
      <Link to="/" className={btnPrimary}>
        Volver al inicio
      </Link>
    </div>
  );
}
