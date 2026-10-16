import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { btnPrimary, btnSecondary, card, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { refreshPremium, usePremium } from '../hooks/usePremium';
import { getSupabase } from '../lib/auth/supabase';
import { appUrl, config } from '../lib/state/config';

const STATUS_TEXT: Record<string, string> = {
  active: 'Activa',
  trialing: 'Periodo de prueba',
  past_due: 'Pago pendiente: actualiza tu método de pago',
  unpaid: 'Impagada',
  canceled: 'Cancelada',
  incomplete: 'Pendiente de confirmar el pago',
};

export function AccountPage() {
  useDocumentMeta();
  const premium = usePremium();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutReturn = params.get('checkout') === 'success';

  // Tras volver de Stripe no confiamos en la redirección: se vuelve a consultar el backend.
  useEffect(() => {
    if (!checkoutReturn) return;
    refreshPremium();
    const timer = window.setTimeout(refreshPremium, 4000);
    return () => window.clearTimeout(timer);
  }, [checkoutReturn]);

  const sendLink = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: appUrl('/cuenta') },
    });
    setBusy(false);
    if (authError) setError('No se ha podido enviar el enlace. Revisa el correo e inténtalo de nuevo.');
    else setSent(true);
  };

  const openBilling = async (path: 'create-portal-session' | 'create-checkout-session') => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const returnUrl = appUrl('/cuenta');
      const { data, error: invokeError } = await supabase.functions.invoke<{ url?: string }>(path, { body: { returnUrl } });
      if (invokeError || !data?.url) throw invokeError ?? new Error('Sin URL');
      window.location.assign(data.url);
    } catch {
      setError('No se ha podido abrir la facturación. Inténtalo de nuevo más tarde.');
      setBusy(false);
    }
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
    refreshPremium();
  };

  if (premium.status === 'unavailable') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className={sectionTitle}>Tu cuenta</h1>
        <div className="mt-6">
          <Alert tone="info" title="Cuentas no disponibles en este entorno">
            <p>
              La cuenta sirve para gestionar Premium. Mientras no esté configurada, la conversión funciona sin registro.
              {!config.isProduction && ' En desarrollo, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver README).'}
            </p>
          </Alert>
        </div>
      </div>
    );
  }

  if (premium.status === 'loading') {
    return (
      <div role="status" className="mx-auto max-w-md px-4 py-16 text-center text-ink-soft">
        Cargando tu cuenta…
      </div>
    );
  }

  if (premium.status === 'anonymous') {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-12">
        <h1 className={sectionTitle}>Entrar</h1>
        {sent ? (
          <Alert tone="success" title="Revisa tu correo">
            <p>Te hemos enviado un enlace para entrar. Puede tardar unos minutos.</p>
          </Alert>
        ) : (
          <form onSubmit={sendLink} className={`${card} space-y-4`}>
            <p className="text-sm leading-relaxed text-ink-soft">
              Te enviaremos un enlace de acceso a tu correo. No necesitas contraseña.
            </p>
            <label className="block text-sm font-medium" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base"
            />
            {error && <Alert tone="error">{error}</Alert>}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    );
  }

  const entitlement = premium.entitlement;
  const statusLabel = entitlement?.status ? STATUS_TEXT[entitlement.status] ?? entitlement.status : 'Sin suscripción';

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className={sectionTitle}>Tu cuenta</h1>

      {checkoutReturn && premium.status !== 'premium' && (
        <Alert tone="info" title="Estamos confirmando tu pago">
          <p>Puede tardar unos segundos. Esta página se actualizará cuando Stripe nos confirme la suscripción.</p>
        </Alert>
      )}

      <section className={`${card} space-y-4`} aria-labelledby="plan-title">
        <h2 id="plan-title" className="text-lg font-semibold">
          Plan
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-soft">Correo</dt>
            <dd className="break-all font-medium">{premium.email}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Plan</dt>
            <dd className="font-medium">{premium.status === 'premium' ? 'Premium' : 'Gratuito'}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Estado de la suscripción</dt>
            <dd className="font-medium">{statusLabel}</dd>
          </div>
          {entitlement?.cancelAtPeriodEnd && (
            <div>
              <dt className="text-ink-soft">Renovación</dt>
              <dd className="font-medium">Cancelada al final del periodo actual</dd>
            </div>
          )}
        </dl>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row">
          {premium.status === 'premium' || entitlement?.status ? (
            <button type="button" className={btnSecondary} onClick={() => openBilling('create-portal-session')} disabled={busy}>
              Gestionar facturación y cancelación
            </button>
          ) : (
            <Link to="/premium" className={btnPrimary}>
              Ver planes de Premium
            </Link>
          )}
          <button type="button" className={btnSecondary} onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  );
}
