// Única regla que decide si un usuario es Premium. Se aplica en el backend.
import type Stripe from 'npm:stripe@17.7.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';

const PREMIUM_STATUSES = new Set(['active', 'trialing']);

export interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function isPremium(row: Pick<SubscriptionRow, 'status' | 'current_period_end'> | null): boolean {
  if (!row || !PREMIUM_STATUSES.has(row.status)) return false;
  if (!row.current_period_end) return false;
  return new Date(row.current_period_end).getTime() > Date.now();
}

/** Escribe el estado tal como lo informa Stripe. Operación idempotente. */
export async function upsertFromStripe(admin: SupabaseClient, userId: string, sub: Stripe.Subscription): Promise<void> {
  // La API moderna mueve current_period_end a los items; se leen ambas formas.
  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: sub.items?.data?.[0]?.price?.id ?? null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end === true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`upsert subscriptions: ${error.message}`);
}
