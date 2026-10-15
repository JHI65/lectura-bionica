import { Link } from 'react-router-dom';
import { AdSlot } from '../components/AdSlot';
import { Converter } from '../components/Converter';
import { card, linkBtn, sectionTitle } from '../components/ui';
import { faqFor } from '../content/faq';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useI18n } from '../i18n/useI18n';
import { config } from '../lib/state/config';

export function HomePage() {
  useDocumentMeta();
  const { t, locale, href } = useI18n();
  const h = t.home;
  const faq = faqFor(locale);
  // Premium solo existe en español y mientras esté activado.
  const showPremium = config.premiumEnabled && locale === 'es';

  return (
    <>
      <section>
       <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-16">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">{h.eyebrow}</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{h.h1}</h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            {h.intro}{' '}
            <Link to={href('guide-what')} className={linkBtn}>
              {h.introLink}
            </Link>
          </p>
        </div>

        <div id="convertir" className="mt-8 scroll-mt-6">
          <Converter />
        </div>

        <figure className={`${card} mt-12 max-w-3xl`}>
          <figcaption className="mb-3 text-xs uppercase tracking-wide text-ink-soft">{h.exampleCaption}</figcaption>
          <p className="text-lg leading-loose">
            {h.example.map(([bold, rest]) => (
              <span key={bold + rest}>
                <b>{bold}</b>
                {rest}
              </span>
            ))}
          </p>
        </figure>
       </div>
      </section>

      <section aria-labelledby="how-title" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="how-title" className={sectionTitle}>
            {h.howTitle}
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {h.steps.map((step, index) => (
              <li key={step.title} className={card}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand">{index + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="features-title" className={sectionTitle}>
          {h.featuresTitle}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {h.features.map((feature) => (
            <li key={feature} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5 text-ink-soft shadow-sm">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-gradient" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-soft">
          {h.pdfNote}{' '}
          <Link className={linkBtn} to={href('guide-pdf')}>
            {h.pdfNoteLink}
          </Link>
        </p>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-title" className={sectionTitle}>
            {h.faqTitle}
          </h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {faq.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  {item.q}
                  <span className="text-brand transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {showPremium && (
        <section aria-labelledby="premium-title" className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 rounded-3xl bg-ink p-8 text-white sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <h2 id="premium-title" className="text-2xl font-semibold">
                {h.premiumTitle}
              </h2>
              <p className="max-w-xl leading-relaxed text-slate-300">{h.premiumBody(config.premiumPriceLabel)}</p>
            </div>
            <Link to={href('premium')} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-5 py-3 font-medium text-ink hover:bg-slate-100">
              {h.premiumLink}
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="privacy-title" className="mx-auto max-w-6xl px-4 pb-16">
        <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <h2 id="privacy-title" className="text-lg font-semibold">
              {h.privacyTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">{h.privacyBody}</p>
          </div>
          <Link to={href('privacy')} className={linkBtn}>
            {h.privacyLink}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-12">
        <AdSlot />
      </div>
    </>
  );
}
