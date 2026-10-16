// Estado Premium compartido en memoria. Viene del backend (entitlement) y
// nunca se persiste en el navegador ni se cambia desde el cliente.
//
// supabase-js se importa de forma diferida: sin configuración no se descarga.
import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Entitlement } from '../lib/auth/entitlement';
import { isSupabaseConfigured } from '../lib/state/config';

export type PremiumStatus = 'unavailable' | 'anonymous' | 'loading' | 'free' | 'premium' | 'error';

export interface PremiumState {
  status: PremiumStatus;
  email: string | null;
  entitlement: Entitlement | null;
}

const UNAVAILABLE: PremiumState = { status: 'unavailable', email: null, entitlement: null };
let state: PremiumState = isSupabaseConfigured ? { status: 'loading', email: null, entitlement: null } : UNAVAILABLE;
const listeners = new Set<() => void>();
let started = false;
let requestId = 0;

function emit(next: PremiumState) {
  state = next;
  listeners.forEach((l) => l());
}

async function client() {
  if (!isSupabaseConfigured) return null;
  const { getSupabase } = await import('../lib/auth/supabase');
  return getSupabase();
}

async function refreshFor(session: Session | null) {
  const current = ++requestId;
  if (!session) {
    emit({ status: 'anonymous', email: null, entitlement: null });
    return;
  }
  emit({ ...state, status: 'loading', email: session.user.email ?? null });
  try {
    const { fetchEntitlement } = await import('../lib/auth/entitlement');
    const entitlement = await fetchEntitlement();
    if (current !== requestId) return;
    emit({ status: entitlement?.premium ? 'premium' : 'free', email: session.user.email ?? null, entitlement });
  } catch {
    if (current !== requestId) return;
    // Ante la duda, no se ocultan anuncios: solo el backend puede confirmar Premium.
    emit({ status: 'error', email: session.user.email ?? null, entitlement: null });
  }
}

function start() {
  if (started || !isSupabaseConfigured) return;
  started = true;
  void client().then((supabase) => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((_event, session) => {
      void refreshFor(session);
    });
    void supabase.auth.getSession().then(({ data }) => refreshFor(data.session));
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function refreshPremium(): void {
  void client().then((supabase) => {
    if (supabase) void supabase.auth.getSession().then(({ data }) => refreshFor(data.session));
  });
}

export function usePremium(): PremiumState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
