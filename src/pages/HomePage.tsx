import { Link } from 'react-router-dom';
import { AdSlot } from '../components/AdSlot';
import { Converter } from '../components/Converter';
import { card, linkBtn, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { FAQ } from '../content/faq';
import { config } from '../lib/state/config';

const STEPS = [
  { title: 'Importa', text: 'Arrastra un EPUB o un PDF con texto, o elígelo desde tu dispositivo.' },
  { title: 'Extrae', text: 'Leemos capítulos, títulos y párrafos. Si un PDF no tiene texto, te lo indicamos.' },
  { title: 'Personaliza', text: 'Elige la intensidad de la negrita, la letra, el interlineado y el tema.' },
  { title: 'Descarga', text: 'Obtén un EPUB o un PDF transformado, listo para leer donde prefieras.' },
];

const FEATURES = [
  'EPUB con capítulos, enlaces, listas, énfasis e imágenes.',
  'PDF reformateado a partir del texto, con títulos y párrafos.',
  'Negrita bionica ajustable y vista previa en tiempo real.',
  'Tipografía, interlineado, ancho y tema claro, sepia u oscuro.',
  'Sin registro para convertir y descargar.',
  'Tu documento se procesa en tu navegador: no se sube a ningún servidor.',
];

export function HomePage() {
  useDocumentMeta('/');

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-16">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">Personalización de la lectura</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Conversor PDF/EPUB a Lectura Biónica
          </h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            Convierte un libro o documento con texto a lectura biónica, ajusta la tipografía a tu gusto, revisa la vista previa y descarga el resultado. Sin registro.{' '}
            <Link to="/que-es-la-lectura-bionica" className={linkBtn}>
              ¿Qué es la lectura biónica?
            </Link>
          </p>
        </div>

        <div id="convertir" className="mt-8 scroll-mt-6">
          <Converter />
        </div>

        <figure className={`${card} mt-12 max-w-3xl`}>
          <figcaption className="mb-3 text-xs uppercase tracking-wide text-ink-soft">Ejemplo ilustrativo</figcaption>
          <p className="text-lg leading-loose">
            <b>Lec</b>tura de un <b>pár</b>rafo con <b>nega</b>rita <b>al</b> inicio de <b>ca</b>da <b>pa</b>labra, <b>sin</b> cambiar el texto.
          </p>
        </figure>
      </section>

      <section aria-labelledby="how-title" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="how-title" className={sectionTitle}>
            Cómo funciona
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
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
          Qué puedes hacer
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex gap-3 rounded-xl bg-white p-5 text-ink-soft shadow-sm">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Para PDF, el resultado es una reconstrucción a partir del texto: columnas, tablas, imágenes, notas al pie y fórmulas pueden no conservarse.{' '}
          <Link className={linkBtn} to="/convertir-pdf-a-lectura-bionica">Cómo funciona con PDF</Link>
        </p>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-title" className={sectionTitle}>
            Preguntas frecuentes
          </h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {FAQ.map((item) => (
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

      <section aria-labelledby="premium-title" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 rounded-3xl bg-ink p-8 text-white sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <h2 id="premium-title" className="text-2xl font-semibold">
              Premium: sin anuncios
            </h2>
            <p className="max-w-xl leading-relaxed text-slate-300">
              Todas las funciones gratuitas, sin publicidad en la aplicación. {config.premiumPriceLabel}, cancelable en cualquier momento.
            </p>
          </div>
          <Link to="/premium" className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-5 py-3 font-medium text-ink hover:bg-slate-100">
            Ver Premium
          </Link>
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="mx-auto max-w-6xl px-4 pb-16">
        <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <h2 id="privacy-title" className="text-lg font-semibold">
              Tu privacidad
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Procesamos tus archivos en tu navegador. Solo guardamos tus ajustes de lectura en este dispositivo. Los anuncios y la analítica requieren tu consentimiento.
            </p>
          </div>
          <Link to="/privacidad" className={linkBtn}>
            Leer la política de privacidad
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-12">
        <AdSlot label="Publicidad" />
      </div>
    </>
  );
}
