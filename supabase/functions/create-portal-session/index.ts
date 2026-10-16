// POST → { url }. Portal de facturación de Stripe: cambiar método de pago,
// ver facturas y cancelar. La cancelación la gestiona Stripe y llega por webhook.
import { preflight, json, SITE_URL } from '../_shared/http.ts';
import { adminClient, authenticatedUser, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const user = await authenticatedUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!SITE_URL) return json({ error: 'not_configured' }, 503);

  const { data, error } = await adminClient()
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();
  if (error) return json({ error: 'lookup_failed' }, 500);
  if (!data?.stripe_customer_id) return json({ error: 'no_customer' }, 404);

  const session = await stripeClient().billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${SITE_URL}/cuenta`,
  });
  return json({ url: session.url });
});
