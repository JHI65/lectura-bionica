// Consulta del estado Premium: SIEMPRE al backend, que lo comprueba contra
// la tabla de suscripciones que rellena el webhook firmado de Stripe.
// Nada de este estado se guarda en localStorage ni se deriva del cliente.
import { getSupabase } from './supabase';

export interface Entitlement {
  premium: boolean;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  /** Ya tuvo alguna suscripción: no tiene derecho a otra prueba gratuita. */
  hadSubscription: boolean;
}

export async function fetchEntitlement(): Promise<Entitlement | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke<Entitlement>('entitlement', { method: 'GET' });
  if (error || !data) throw error ?? new Error('Sin respuesta de entitlement');
  return { premium: data.premium === true, status: data.status ?? null, cancelAtPeriodEnd: data.cancelAtPeriodEnd === true, hadSubscription: data.hadSubscription === true };
}
