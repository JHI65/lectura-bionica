// Webhook de Stripe. Verifica la firma con STRIPE_WEBHOOK_SECRET antes de
// tocar la base de datos. Ningún otro camino puede activar Premium.
import Stripe from 'npm:stripe@17.7.0';
import { adminClient, stripeClient } from '../_shared/clients.ts';
import { upsertFromStripe } from '../_shared/subscription.ts';

const RELEVANT = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const signature = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !secret) return new Response('missing signature', { status: 400 });

  const body = await req.text();
  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response('invalid signature', { status: 400 });
  }

  if (!RELEVANT.has(event.type)) return new Response('ignored', { status: 200 });

  try {
    const admin = adminClient();
    const subscriptionId = await subscriptionIdFor(event);
    if (!subscriptionId) return new Response('no subscription', { status: 200 });

    // Siempre se vuelve a consultar la suscripción: el estado vigente es el de Stripe, no el del evento.
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = await resolveUserId(admin, sub);
    if (!userId) {
      console.error('webhook: suscripción sin usuario asociado', sub.id);
      return new Response('unknown customer', { status: 200 });
    }
    await upsertFromStripe(admin, userId, sub);
    return new Response('ok', { status: 200 });
  } catch (error) {
    // 500 hace que Stripe reintente el evento.
    console.error('webhook error', event.type, error);
    return new Response('processing error', { status: 500 });
  }
});

async function subscriptionIdFor(event: Stripe.Event): Promise<string | null> {
  const object = event.data.object as unknown as Record<string, unknown>;
  if (event.type === 'checkout.session.completed') {
    return (object.mode === 'subscription' && typeof object.subscription === 'string') ? object.subscription : null;
  }
  if (event.type.startsWith('invoice.')) {
    return typeof object.subscription === 'string' ? object.subscription : null;
  }
  return typeof object.id === 'string' ? object.id : null;
}

async function resolveUserId(admin: ReturnType<typeof adminClient>, sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.supabase_user_id;
  if (fromMetadata) return fromMetadata;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const { data } = await admin.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).maybeSingle<{ user_id: string }>();
  return data?.user_id ?? null;
}
