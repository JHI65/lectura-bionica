// Acciones de cuenta y pago. Todo pasa por Firebase Auth y funciones del servidor:
// el cliente nunca decide el precio, la URL de retorno ni el estado Premium.
import { appUrl } from '../state/config';
import { getFirebase } from './firebase';

const EMAIL_KEY = 'lb:emailForSignIn';

async function need() {
  const client = await getFirebase();
  if (!client) throw new Error('Firebase no configurado');
  return client;
}

export async function signInWithGoogle(): Promise<void> {
  const { auth } = await need();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  await signInWithPopup(auth, new GoogleAuthProvider());
}

/** Envía el enlace de acceso. El correo se recuerda en este navegador para completar el acceso. */
export async function sendEmailLink(email: string): Promise<void> {
  const { auth } = await need();
  const { sendSignInLinkToEmail } = await import('firebase/auth');
  await sendSignInLinkToEmail(auth, email, { url: appUrl('/cuenta'), handleCodeInApp: true });
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Sin almacenamiento: se pedirá el correo al volver.
  }
}

export type EmailLinkResult = 'none' | 'done' | 'needs-email';

/** Si la URL actual es un enlace de acceso, completa el inicio de sesión. */
export async function completeEmailLink(typedEmail?: string): Promise<EmailLinkResult> {
  const { auth } = await need();
  const { isSignInWithEmailLink, signInWithEmailLink } = await import('firebase/auth');
  if (!isSignInWithEmailLink(auth, window.location.href)) return 'none';
  let email = typedEmail ?? null;
  if (!email) {
    try {
      email = localStorage.getItem(EMAIL_KEY);
    } catch {
      email = null;
    }
  }
  if (!email) return 'needs-email';
  await signInWithEmailLink(auth, email, window.location.href);
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // nada
  }
  // Quita los parámetros del enlace de la barra de direcciones.
  window.history.replaceState(null, '', window.location.pathname);
  return 'done';
}

export async function signOutUser(): Promise<void> {
  const { auth } = await need();
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

async function callForUrl(name: 'createCheckoutSession' | 'createPortalSession', data: Record<string, unknown>): Promise<string> {
  const { functions } = await need();
  const { httpsCallable } = await import('firebase/functions');
  const result = await httpsCallable<Record<string, unknown>, { url?: string }>(functions, name)(data);
  const url = result.data?.url;
  if (!url) throw new Error('Sin URL');
  return url;
}

export const checkoutUrl = (plan: 'monthly' | 'yearly') => callForUrl('createCheckoutSession', { plan });
export const portalUrl = () => callForUrl('createPortalSession', {});
