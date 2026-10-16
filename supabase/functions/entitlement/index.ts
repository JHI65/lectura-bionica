// GET /entitlement → { premium, status, cancelAtPeriodEnd, hadSubscription }
// Lee el estado verificado por el webhook. El cliente no puede influir en el resultado.
import { preflight, json } from '../_shared/http.ts';
import { adminClient, authenticatedUser } from '../_shared/clients.ts';
import { isPremium, type SubscriptionRow } from '../_shared/subscription.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const user = await authenticatedUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);

  const { data, error } = await adminClient()
    .from('subscriptions')
    .select('user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .maybeSingle<SubscriptionRow>();
  if (error) return json({ error: 'lookup_failed' }, 500);

  return json({
    premium: isPremium(data),
    status: data?.status ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    // Ya tuvo una suscripción: no tiene derecho a otra prueba gratuita.
    hadSubscription: Boolean(data?.stripe_subscription_id),
  });
});
