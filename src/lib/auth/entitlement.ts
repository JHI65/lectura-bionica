// Estado Premium. Lo escribe SOLO el webhook de Stripe (servidor) en
// subscriptions/{uid}; las reglas de Firestore impiden cualquier escritura del
// cliente. Aquí solo se interpreta ese documento. Nada se guarda en localStorage.

export interface Entitlement {
  premium: boolean;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  /** Ya tuvo alguna suscripción: no tiene derecho a otra prueba gratuita. */
  hadSubscription: boolean;
}

/** Lo que el webhook guarda. `currentPeriodEnd` llega como Timestamp de Firestore. */
export interface SubscriptionDoc {
  status?: unknown;
  currentPeriodEnd?: { toMillis?: () => number } | null;
  cancelAtPeriodEnd?: unknown;
  stripeSubscriptionId?: unknown;
}

const PREMIUM_STATUSES = new Set(['active', 'trialing']);

/** active/trialing dan acceso mientras el periodo no haya terminado; past_due no. */
export function entitlementFromDoc(data: SubscriptionDoc | undefined, now = Date.now()): Entitlement {
  if (!data) return { premium: false, status: null, cancelAtPeriodEnd: false, hadSubscription: false };
  const status = typeof data.status === 'string' ? data.status : null;
  const end = typeof data.currentPeriodEnd?.toMillis === 'function' ? data.currentPeriodEnd.toMillis() : null;
  const premium = status !== null && PREMIUM_STATUSES.has(status) && end !== null && end > now;
  return { premium, status, cancelAtPeriodEnd: data.cancelAtPeriodEnd === true, hadSubscription: typeof data.stripeSubscriptionId === 'string' };
}
