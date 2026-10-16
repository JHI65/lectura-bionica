// Reglas de suscripción. Sin dependencias de Firebase ni de Stripe para poder probarlas.

/** Subconjunto de stripe.Subscription que usamos. */
export interface StripeSubscriptionLike {
  id: string;
  status: string;
  customer: string | { id: string } | null;
  cancel_at_period_end?: boolean | null;
  current_period_end?: number | null;
  metadata?: Record<string, string> | null;
  items?: { data: Array<{ price?: { id?: string } | null; current_period_end?: number | null }> } | null;
}

export interface SubscriptionRecord {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  status: string;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

const PREMIUM_STATUSES = new Set(['active', 'trialing']);

/** Misma regla que el cliente (src/lib/auth/entitlement.ts), aplicada en el servidor. */
export function isPremiumRecord(record: Pick<SubscriptionRecord, 'status' | 'currentPeriodEnd'> | null | undefined, now = Date.now()): boolean {
  if (!record || !PREMIUM_STATUSES.has(record.status) || !record.currentPeriodEnd) return false;
  return record.currentPeriodEnd.getTime() > now;
}

/** Traduce una suscripción de Stripe a lo que se guarda. La API nueva mueve el fin de periodo a los items. */
export function recordFromStripe(sub: StripeSubscriptionLike): SubscriptionRecord {
  const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  return {
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : (sub.customer?.id ?? null),
    stripeSubscriptionId: sub.id,
    status: sub.status,
    priceId: sub.items?.data?.[0]?.price?.id ?? null,
    currentPeriodEnd: end ? new Date(end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end === true,
  };
}

export type Plan = 'monthly' | 'yearly';

export function planFrom(value: unknown): Plan {
  return value === 'yearly' ? 'yearly' : 'monthly';
}

/** La prueba solo se ofrece a quien nunca tuvo una suscripción. */
export function trialDaysFor(hadSubscription: boolean, raw: string | undefined): number | null {
  if (hadSubscription) return null;
  const days = Number(raw ?? '7');
  return Number.isInteger(days) && days > 0 && days <= 90 ? days : null;
}
