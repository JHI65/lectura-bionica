// Estado Premium compartido en memoria. Viene de Firestore (escrito por el webhook) y
// nunca se persiste en el navegador ni se cambia desde el cliente.
//
// El SDK de Firebase se importa de forma diferida: sin configuración no se descarga.
import { useSyncExternalStore } from 'react';
import type { Entitlement } from '../lib/auth/entitlement';
import { isFirebaseConfigured } from '../lib/state/config';

export type PremiumStatus = 'unavailable' | 'anonymous' | 'loading' | 'free' | 'premium' | 'error';

export interface PremiumState {
  status: PremiumStatus;
  email: string | null;
  entitlement: Entitlement | null;
}

const UNAVAILABLE: PremiumState = { status: 'unavailable', email: null, entitlement: null };
let state: PremiumState = isFirebaseConfigured ? { status: 'loading', email: null, entitlement: null } : UNAVAILABLE;
const listeners = new Set<() => void>();
let started = false;
let stopSnapshot: (() => void) | null = null;

function emit(next: PremiumState) {
  state = next;
  listeners.forEach((l) => l());
}

// Sesión → escucha en vivo del documento subscriptions/{uid}. Así, al volver de Stripe
// el cambio llega solo, sin consultas periódicas. Si falla la lectura, no se ocultan anuncios.
async function start() {
  if (started || !isFirebaseConfigured) return;
  started = true;
  const { getFirebase } = await import('../lib/auth/firebase');
  const client = await getFirebase();
  if (!client) return;
  const [{ onAuthStateChanged }, { doc, onSnapshot }, { entitlementFromDoc }] = await Promise.all([
    import('firebase/auth'),
    import('firebase/firestore'),
    import('../lib/auth/entitlement'),
  ]);

  onAuthStateChanged(client.auth, (user) => {
    stopSnapshot?.();
    stopSnapshot = null;
    if (!user) {
      emit({ status: 'anonymous', email: null, entitlement: null });
      return;
    }
    const email = user.email ?? null;
    emit({ status: 'loading', email, entitlement: null });
    stopSnapshot = onSnapshot(
      doc(client.db, 'subscriptions', user.uid),
      (snapshot) => {
        const entitlement = entitlementFromDoc(snapshot.data());
        emit({ status: entitlement.premium ? 'premium' : 'free', email, entitlement });
      },
      () => emit({ status: 'error', email, entitlement: null }),
    );
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void start();
  return () => listeners.delete(listener);
}

export function usePremium(): PremiumState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
