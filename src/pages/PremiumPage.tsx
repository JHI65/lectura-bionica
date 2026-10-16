import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { btnPrimary, card, linkBtn, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { usePremium } from '../hooks/usePremium';
import { getSupabase } from '../lib/auth/supabase';
import { BATCH_MAX_FILES, BATCH_MAX_FREE, config, isSupabaseConfigured, PREMIUM_MAX_FILE_MB } from '../lib/state/config';
import { track } from '../lib/state/analytics';

type Plan = 'monthly' | 'yearly';

/** Importe numérico de una etiqueta como «2,99 €/mes». null si no se puede leer. */
function priceNumber(label: string): number | null {
  const match = label.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(',', '.')) : null;
}

const euro = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;

const COMPARISON: { feature: string; free: string; premium: string }[] = [
  { feature: 'Conversión de EPUB y PDF, ajustes y descarga', free: 'Incluida', premium: 'Incluida' },
  { feature: 'Anuncios', free: 'Discretos, fuera del texto', premium: 'Ninguno' },
  { feature: 'Tamaño máximo por archivo', free: `${config.maxFileMb} MB`, premium: `${PREMIUM_MAX_FILE_MB} MB` },
  { feature: 'Conversión por lotes', free: `Hasta ${BATCH_MAX_FREE} archivos por lote`, premium: `Hasta ${BATCH_MAX_FILES} archivos por lote` },
];

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: '¿Mis archivos se suben a algún servidor?',
    a: 'No. Con Premium también se procesan todos en tu navegador. La cuenta solo guarda tu correo y el estado de la suscripción.',
  },
  {
    q: '¿Cómo se cancela?',
    a: 'Desde tu cuenta, en cualquier momento. Mantienes Premium hasta el final del periodo ya pagado.',
  },
  {
    q: '¿Puedo cambiar de plan?',
    a: 'Sí, entre mensual y anual, desde la gestión de facturación de tu cuenta.',
  },
];

export function PremiumPage() {
  useDocumentMeta();
  const premium = usePremium();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ url?: string }>('create-checkout-session', {
        body: { plan },
      });
      if (invokeError || !data?.url) throw invokeError ?? new Error('Sin URL de pago');
      track('premium_checkout_started', { plan });
      window.location.assign(data.url);
    } catch {
      setError('No se ha podido iniciar el pago. Inténtalo de nuevo más tarde.');
      setBusy(false);
    }
  };

  const monthly = priceNumber(config.premiumPriceLabel);
  const yearly = priceNumber(config.premiumYearlyPriceLabel);
  const savingPercent = monthly && yearly && yearly < monthly * 12 ? Math.round((1 - yearly / (monthly * 12)) * 100) : null;
  const perMonth = yearly ? euro(yearly / 12) : null;
  // La prueba gratuita solo es para la primera suscripción: el servidor lo hace cumplir.
  const trial = premium.entitlement?.hadSubscription ? 0 : config.premiumTrialDays;
  const selectedLabel = plan === 'yearly' ? config.premiumYearlyPriceLabel : config.premiumPriceLabel;

  const planClass = (value: Plan) =>
    `flex min-h-[44px] flex-1 flex-col gap-1 rounded-xl border-2 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
      plan === value ? 'border-brand bg-brand-soft' : 'border-slate-200 bg-white hover:border-slate-300'
    }`;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <header className="space-y-4">
        <h1 className={sectionTitle}>Premium: sin anuncios, archivos grandes y lotes</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">
          Todo lo gratuito, más archivos de hasta {PREMIUM_MAX_FILE_MB} MB, lotes de hasta {BATCH_MAX_FILES} archivos y ninguna publicidad.
        </p>
      </header>

      <section className={`${card} space-y-6`} aria-labelledby="plans-title">
        <h2 id="plans-title" className="text-xl font-semibold">
          Elige tu plan
        </h2>
        <div role="radiogroup" aria-labelledby="plans-title" className="flex flex-col gap-3 sm:flex-row">
          <button type="button" role="radio" aria-checked={plan === 'yearly'} className={planClass('yearly')} onClick={() => setPlan('yearly')}>
            <span className="flex flex-wrap items-center gap-2 font-semibold">
              Anual
              {savingPercent !== null && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-slate-300">Ahorras un {savingPercent} %</span>
              )}
            </span>
            <span className="text-2xl font-bold tracking-tight">{config.premiumYearlyPriceLabel}</span>
            {perMonth && <span className="text-sm text-ink-soft">equivale a {perMonth} al mes</span>}
          </button>
          <button type="button" role="radio" aria-checked={plan === 'monthly'} className={planClass('monthly')} onClick={() => setPlan('monthly')}>
            <span className="font-semibold">Mensual</span>
            <span className="text-2xl font-bold tracking-tight">{config.premiumPriceLabel}</span>
            <span className="text-sm text-ink-soft">sin compromiso</span>
          </button>
        </div>
        {trial > 0 && (
          <p className="text-sm font-medium">
            {trial} días de prueba gratis en tu primera suscripción. Después se cobra {selectedLabel}.
          </p>
        )}

        {premium.status === 'premium' && (
          <Alert tone="success" title="Ya tienes Premium">
            <p>
              Tu suscripción está activa.{' '}
              <Link className={linkBtn} to="/cuenta">
                Gestionar mi cuenta
              </Link>
            </p>
          </Alert>
        )}

        {premium.status === 'unavailable' && (
          <Alert tone="info" title="Suscripción no disponible todavía">
            <p>
              Premium aún no está activo en este entorno. {!config.isProduction && 'En desarrollo, configura Supabase y Stripe siguiendo el README; no se simulan pagos reales.'}
            </p>
          </Alert>
        )}

        {premium.status === 'anonymous' && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Necesitas una cuenta para suscribirte. Solo te pediremos tu correo electrónico.</p>
            <Link to="/cuenta" className={btnPrimary}>
              Entrar o crear cuenta
            </Link>
          </div>
        )}

        {premium.status === 'free' && (
          <div className="space-y-3">
            {error && <Alert tone="error">{error}</Alert>}
            <button type="button" className={btnPrimary} onClick={startCheckout} disabled={busy || !isSupabaseConfigured}>
              {busy ? 'Redirigiendo al pago…' : trial > 0 ? `Empezar prueba de ${trial} días` : 'Suscribirme a Premium'}
            </button>
            <p className="text-xs text-ink-soft">
              Pago seguro gestionado por Stripe. La suscripción se renueva automáticamente hasta que la canceles desde tu cuenta
              {trial > 0 ? '; si cancelas antes de que acabe la prueba, no se te cobra nada' : ''}.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="compare-title" className="space-y-4">
        <h2 id="compare-title" className="text-xl font-semibold">
          Gratis y Premium
        </h2>
        <div role="region" aria-label="Tabla comparativa, desplazable" tabIndex={0} className="overflow-x-auto rounded-2xl border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Comparación entre la versión gratuita y Premium</caption>
            <thead className="bg-slate-50 text-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Función
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Gratis
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="px-4 py-3 font-medium">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3 text-ink-soft">{row.free}</td>
                  <td className="px-4 py-3 font-medium">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink-soft">
          Puedes seguir usando la aplicación gratis y sin registro.{' '}
          <Link to="/convertir" className={linkBtn}>
            Ir al conversor
          </Link>
        </p>
      </section>

      <section aria-labelledby="faq-title" className="space-y-4">
        <h2 id="faq-title" className="text-xl font-semibold">
          Preguntas sobre Premium
        </h2>
        <dl className="space-y-4">
          {QUESTIONS.map((item) => (
            <div key={item.q}>
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-1 leading-relaxed text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
