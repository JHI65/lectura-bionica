// POST { plan?: 'monthly' | 'yearly' } → { url }. Crea una sesión de Stripe Checkout para el usuario autenticado.
// La URL de retorno la fija el servidor (SITE_URL), no el cliente.
import { preflight, json, SITE_URL } from '../_shared/http.ts';
import { adminClient, authenticatedUser, stripeClient } from '../_shared/clients.ts';
import { isPremium, type SubscriptionRow } from '../_shared/subscription.ts';

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (error) {
    // El detalle va al log del servidor; al cliente solo un código.
    console.error('create-checkout-session', error instanceof Error ? error.message : error);
    return json({ error: 'checkout_failed' }, 502);
  }
});

async function handle(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const user = await authenticatedUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);

  // El cliente solo elige entre dos planes; el Price real lo fija el servidor.
  const body = (await req.json().catch(() => null)) as { plan?: unknown } | null;
  const plan = body?.plan === 'yearly' ? 'yearly' : 'monthly';
  const priceId = Deno.env.get(plan === 'yearly' ? 'STRIPE_PRICE_ID_YEARLY' : 'STRIPE_PRICE_ID');
  if (!SITE_URL || !priceId) return json({ error: 'not_configured' }, 503);

  const admin = adminClient();
  const { data: existing } = await admin
    .from('subscriptions')
    .select('user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .maybeSingle<SubscriptionRow>();

  if (isPremium(existing)) return json({ error: 'already_premium' }, 409);

  const stripe = stripeClient();
  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    const { error } = await admin
      .from('subscriptions')
      .upsert({ user_id: user.id, stripe_customer_id: customerId, status: 'none', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) return json({ error: 'storage_failed' }, 500);
  }

  // Prueba gratuita solo la primera vez: quien ya tuvo una suscripción no la repite.
  const trialDays = Number(Deno.env.get('STRIPE_TRIAL_DAYS') ?? '7');
  const eligibleForTrial = !existing?.stripe_subscription_id && Number.isInteger(trialDays) && trialDays > 0 && trialDays <= 90;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
      ...(eligibleForTrial ? { trial_period_days: trialDays } : {}),
    },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/cuenta?checkout=success`,
    cancel_url: `${SITE_URL}/premium`,
  });

  return json({ url: session.url });
}
