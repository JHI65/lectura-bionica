// Estado Premium compartido en memoria. Viene del backend (entitlement) y
// nunca se persiste en el navegador ni se cambia desde el cliente.
import { useSyncExternalStore } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { fetchEntitlement, type Entitlement } from '../lib/auth/entitlement';
import { getSupabase } from '../lib/auth/supabase';

export type PremiumStatus = 'unavailable' | 'anonymous' | 'loading' | 'free' | 'premium' | 'error';

export interface PremiumState {
  status: PremiumStatus;
  email: string | null;
  entitlement: Entitlement | null;
}

const INITIAL: PremiumState = { status: 'loading', email: null, entitlement: null };
let state: PremiumState = getSupabase() ? INITIAL : { status: 'unavailable', email: null, entitlement: null };
const listeners = new Set<() => void>();
let started = false;
let requestId = 0;

function emit(next: PremiumState) {
  state = next;
  listeners.forEach((l) => l());
}

async function refreshFor(session: Session | null) {
  const current = ++requestId;
  if (!session) {
    emit({ status: 'anonymous', email: null, entitlement: null });
    return;
  }
  emit({ ...state, status: 'loading', email: session.user.email ?? null });
  try {
    const entitlement = await fetchEntitlement();
    if (current !== requestId) return;
    emit({
      status: entitlement?.premium ? 'premium' : 'free',
      email: session.user.email ?? null,
      entitlement,
    });
  } catch {
    if (current !== requestId) return;
    // Ante la duda, no se ocultan anuncios: solo el backend puede confirmar Premium.
    emit({ status: 'error', email: session.user.email ?? null, entitlement: null });
  }
}

function start() {
  if (started) return;
  const supabase = getSupabase();
  if (!supabase) return;
  started = true;
  supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    void refreshFor(session);
  });
  void supabase.auth.getSession().then(({ data }) => refreshFor(data.session));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function refreshPremium(): void {
  const supabase = getSupabase();
  if (!supabase) return;
  void supabase.auth.getSession().then(({ data }) => refreshFor(data.session));
}

export function usePremium(): PremiumState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
