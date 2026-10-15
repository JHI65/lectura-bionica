import { Link, useLocation } from 'react-router-dom';
import { AdSlot } from '../components/AdSlot';
import { btnPrimary, card, linkBtn, sectionTitle } from '../components/ui';
import { LEGAL_DOCS } from '../content/legal';
import { findByPath, normalizePath } from '../content/routes';
import { GUIDES } from '../content/seo-pages';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useI18n } from '../i18n/useI18n';

/** Identificador estable para anclas a partir de un encabezado. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Página de guía: una intención de búsqueda por ruta, sin contenido duplicado. */
export function GuidePage() {
  const { pathname } = useLocation();
  const { t, locale, href } = useI18n();
  const match = findByPath(normalizePath(pathname));
  const guides = GUIDES[locale];
  const page = match ? guides.find((g) => g.id === match.entry.id) : undefined;
  useDocumentMeta();

  if (!page) return <NotFoundPage />;

  const related = guides.filter((g) => g.id !== page.id).slice(0, 4);
  const showToc = page.sections.length >= 5;

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-4">
        <h1 className={sectionTitle}>{page.h1}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">{page.intro}</p>
        <p className="text-sm text-ink-soft">
          {t.guide.updated}: {page.updated}
        </p>
      </header>

      {showToc && (
        <nav aria-label={t.guide.toc} className={`${card} text-sm`}>
          <p className="font-semibold">{t.guide.toc}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {page.sections.map((section) => (
              <li key={section.heading}>
                <a className={linkBtn} href={`#${slugify(section.heading)}`}>
                  {section.heading}
                </a>
              </li>
            ))}
            {page.faq && page.faq.length > 0 && (
              <li>
                <a className={linkBtn} href="#faq">
                  {t.guide.faq}
                </a>
              </li>
            )}
          </ol>
        </nav>
      )}

      {page.sections.map((section) => {
        const ListTag = section.ordered ? 'ol' : 'ul';
        return (
          <section key={section.heading} className="space-y-4">
            <h2 id={slugify(section.heading)} className="scroll-mt-6 text-xl font-semibold">
              {section.heading}
            </h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
            {section.list && (
              <ListTag className={`${section.ordered ? 'list-decimal' : 'list-disc'} space-y-2 pl-6 leading-relaxed text-ink-soft`}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ListTag>
            )}
          </section>
        );
      })}

      {page.faq && page.faq.length > 0 && (
        <section aria-labelledby="faq" className="space-y-4">
          <h2 id="faq" className="scroll-mt-6 text-xl font-semibold">
            {t.guide.faq}
          </h2>
          <dl className="space-y-5">
            {page.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1 leading-relaxed text-ink-soft">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className={`${card} flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <p className="font-medium">{t.guide.tryIt}</p>
        <Link to={href('home')} className={btnPrimary}>
          {page.cta.label}
        </Link>
      </div>

      <nav aria-label={t.guide.others} className="space-y-3">
        <h2 className="text-lg font-semibold">{t.guide.others}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {related.map((g) => (
            <li key={g.id}>
              <Link className={`${linkBtn} block rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium`} to={href(g.id)}>
                {g.h1}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <AdSlot />
    </article>
  );
}

/** Documentos legales. Los datos del titular se rellenan en src/content/legal.ts. */
export function LegalPage() {
  const { pathname } = useLocation();
  const { t, locale } = useI18n();
  const match = findByPath(normalizePath(pathname));
  const doc = match ? LEGAL_DOCS[locale].find((d) => d.id === match.entry.id) : undefined;
  useDocumentMeta();

  if (!doc) return <NotFoundPage />;

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className={sectionTitle}>{doc.title}</h1>
        <p className="text-sm text-ink-soft">
          {t.legal.updated}: {doc.updated}
        </p>
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
  const { t, href } = useI18n();
  useDocumentMeta({ title: t.notFound.title, description: t.notFound.description, noindex: true });
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
      <h1 className={sectionTitle}>{t.notFound.title}</h1>
      <p className="text-ink-soft">{t.notFound.body}</p>
      <Link to={href('home')} className={btnPrimary}>
        {t.notFound.home}
      </Link>
    </div>
  );
}
