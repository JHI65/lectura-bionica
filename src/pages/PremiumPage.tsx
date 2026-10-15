import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { btnPrimary, btnSecondary, card, linkBtn, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { usePremium } from '../hooks/usePremium';
import { getSupabase } from '../lib/auth/supabase';
import { appUrl, config, isSupabaseConfigured } from '../lib/state/config';
import { track } from '../lib/state/analytics';

const INCLUDED = [
  'Todas las funciones gratuitas: conversión de EPUB y PDF, ajustes y descarga.',
  'Sin anuncios en toda la aplicación.',
  'Gestión de la suscripción y de la facturación desde tu cuenta.',
];

export function PremiumPage() {
  useDocumentMeta('/premium');
  const premium = usePremium();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const returnUrl = appUrl('/cuenta?checkout=success');
      const { data, error: invokeError } = await supabase.functions.invoke<{ url?: string }>('create-checkout-session', {
        body: { returnUrl },
      });
      if (invokeError || !data?.url) throw invokeError ?? new Error('Sin URL de pago');
      track('premium_checkout_started', { plan: 'premium' });
      window.location.assign(data.url);
    } catch {
      setError('No se ha podido iniciar el pago. Inténtalo de nuevo más tarde.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <header className="space-y-4">
        <h1 className={sectionTitle}>Premium: lee sin anuncios</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">
          Premium elimina toda la publicidad de la aplicación. Las funciones de conversión siguen siendo las mismas.
        </p>
      </header>

      <section className={`${card} space-y-6`} aria-labelledby="price-title">
        <div className="flex flex-wrap items-baseline gap-2">
          <p id="price-title" className="text-4xl font-bold tracking-tight">
            {config.premiumPriceLabel}
          </p>
        </div>
        <ul className="space-y-3 text-ink-soft">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

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
              {busy ? 'Redirigiendo al pago…' : 'Suscribirme a Premium'}
            </button>
            <p className="text-xs text-ink-soft">
              Pago seguro gestionado por Stripe. La suscripción se renueva automáticamente hasta que la canceles desde tu cuenta.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="free-title" className="space-y-3">
        <h2 id="free-title" className="text-xl font-semibold">
          ¿Y la versión gratuita?
        </h2>
        <p className="leading-relaxed text-ink-soft">
          Puedes seguir usando la aplicación gratis, sin registro. Verás anuncios discretos fuera del texto que lees. Si prefieres no verlos, Premium es la forma de quitarlos.
        </p>
        <Link to="/convertir" className={btnSecondary}>
          Ir al conversor
        </Link>
      </section>
    </div>
  );
}
