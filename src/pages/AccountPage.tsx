import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { btnPrimary, btnSecondary, card, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { usePremium } from '../hooks/usePremium';
import { completeEmailLink, portalUrl, sendEmailLink, signInWithGoogle, signOutUser } from '../lib/auth/actions';
import { config, isFirebaseConfigured } from '../lib/state/config';

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
  const [needsEmail, setNeedsEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutReturn = params.get('checkout') === 'success';

  // Si se llega desde el enlace del correo, se completa el acceso.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    completeEmailLink()
      .then((result) => setNeedsEmail(result === 'needs-email'))
      .catch(() => setError('El enlace de acceso no es válido o ha caducado. Pide uno nuevo.'));
  }, []);

  const sendLink = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (needsEmail) {
        await completeEmailLink(email);
        setNeedsEmail(false);
      } else {
        await sendEmailLink(email);
        setSent(true);
      }
    } catch {
      setError(needsEmail ? 'No se ha podido completar el acceso. Revisa el correo o pide un enlace nuevo.' : 'No se ha podido enviar el enlace. Revisa el correo e inténtalo de nuevo.');
    }
    setBusy(false);
  };

  const googleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      // Cerrar la ventana de Google no es un error que mostrar.
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') setError('No se ha podido entrar con Google. Inténtalo de nuevo.');
    }
    setBusy(false);
  };

  const openBilling = async () => {
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await portalUrl());
    } catch {
      setError('No se ha podido abrir la facturación. Inténtalo de nuevo más tarde.');
      setBusy(false);
    }
  };

  if (premium.status === 'unavailable') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className={sectionTitle}>Tu cuenta</h1>
        <div className="mt-6">
          <Alert tone="info" title="Cuentas no disponibles en este entorno">
            <p>
              La cuenta sirve para gestionar Premium. Mientras no esté configurada, la conversión funciona sin registro.
              {!config.isProduction && ' En desarrollo, configura las variables VITE_FIREBASE_* (ver README).'}
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
            <p>Te hemos enviado un enlace para entrar. Puede tardar unos minutos; mira también la carpeta de spam. Ábrelo en este mismo navegador.</p>
          </Alert>
        ) : (
          <div className={`${card} space-y-5`}>
            {!needsEmail && (
              <>
                <button type="button" className={`${btnSecondary} w-full`} onClick={googleSignIn} disabled={busy}>
                  Continuar con Google
                </button>
                <p className="text-center text-xs text-ink-soft">o con un enlace a tu correo, sin contraseña</p>
              </>
            )}
            <form onSubmit={sendLink} className="space-y-4">
              {needsEmail && (
                <p className="text-sm leading-relaxed text-ink-soft">Para completar el acceso, confirma el correo al que te enviamos el enlace.</p>
              )}
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
                {busy ? 'Enviando…' : needsEmail ? 'Completar acceso' : 'Enviar enlace de acceso'}
              </button>
            </form>
          </div>
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
            <button type="button" className={btnSecondary} onClick={openBilling} disabled={busy}>
              Gestionar facturación y cancelación
            </button>
          ) : (
            <Link to="/premium" className={btnPrimary}>
              Ver planes de Premium
            </Link>
          )}
          <button type="button" className={btnSecondary} onClick={() => void signOutUser()}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  );
}
