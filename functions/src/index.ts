// Funciones de servidor de Premium. El cliente no decide nada sensible:
//  - createCheckoutSession / createPortalSession: exigen sesión y devuelven la URL de Stripe;
//    el precio y las URLs de retorno salen de parámetros del servidor, no de la petición.
//  - stripeWebhook: único escritor de subscriptions/{uid}. Verifica la firma de Stripe.
// Las reglas de Firestore impiden cualquier escritura desde el navegador.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import Stripe from 'stripe';
import { isPremiumRecord, planFrom, recordFromStripe, trialDaysFor, type SubscriptionRecord } from './subscription.js';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const SITE_URL = defineString('SITE_URL');
const STRIPE_PRICE_ID = defineString('STRIPE_PRICE_ID');
const STRIPE_PRICE_ID_YEARLY = defineString('STRIPE_PRICE_ID_YEARLY');
const STRIPE_TRIAL_DAYS = defineString('STRIPE_TRIAL_DAYS', { default: '7' });

// Orígenes que pueden llamar a las funciones. La sesión es obligatoria de todos modos.
const CORS = ['https://readably.online', 'http://localhost:5173', 'http://localhost:4173'];

const db = () => getFirestore();
// Solo en el emulador local se puede redirigir Stripe a un servidor simulado (pruebas sin red).
function stripeOverride(): { host: string; port: number; protocol: 'http' | 'https' } | undefined {
  const base = process.env.FUNCTIONS_EMULATOR === 'true' ? process.env.STRIPE_API_BASE : undefined;
  if (!base) return undefined;
  const url = new URL(base);
  return { host: url.hostname, port: Number(url.port), protocol: url.protocol === 'http:' ? 'http' : 'https' };
}
const stripeClient = () => new Stripe(STRIPE_SECRET_KEY.value(), { httpClient: Stripe.createFetchHttpClient(), ...stripeOverride() });
const siteUrl = () => SITE_URL.value().replace(/\/+$/, '');

interface StoredSubscription extends Omit<SubscriptionRecord, 'currentPeriodEnd'> {
  currentPeriodEnd: Timestamp | null;
}

async function readStored(uid: string): Promise<Partial<StoredSubscription> | undefined> {
  const snap = await db().collection('subscriptions').doc(uid).get();
  return snap.data() as Partial<StoredSubscription> | undefined;
}

function requireUid(auth: { uid: string } | undefined): string {
  if (!auth) throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.');
  return auth.uid;
}

export const createCheckoutSession = onCall({ cors: CORS, secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const uid = requireUid(request.auth);
  const plan = planFrom((request.data as { plan?: unknown } | undefined)?.plan);
  const priceId = plan === 'yearly' ? STRIPE_PRICE_ID_YEARLY.value() : STRIPE_PRICE_ID.value();
  if (!SITE_URL.value() || !priceId) throw new HttpsError('failed-precondition', 'Premium no está configurado.');

  const existing = await readStored(uid);
  if (existing && isPremiumRecord({ status: existing.status ?? '', currentPeriodEnd: existing.currentPeriodEnd?.toDate() ?? null })) {
    throw new HttpsError('already-exists', 'Ya tienes Premium.');
  }

  const stripe = stripeClient();
  let customerId = existing?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: request.auth?.token.email ?? undefined,
      metadata: { firebase_uid: uid },
    });
    customerId = customer.id;
    await db().collection('subscriptions').doc(uid).set({ stripeCustomerId: customerId, status: existing?.status ?? 'none' }, { merge: true });
  }

  const trialDays = trialDaysFor(Boolean(existing?.stripeSubscriptionId), STRIPE_TRIAL_DAYS.value());
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: uid,
    subscription_data: { metadata: { firebase_uid: uid, plan }, ...(trialDays ? { trial_period_days: trialDays } : {}) },
    allow_promotion_codes: true,
    success_url: `${siteUrl()}/cuenta?checkout=success`,
    cancel_url: `${siteUrl()}/premium`,
  });
  return { url: session.url };
});

export const createPortalSession = onCall({ cors: CORS, secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const uid = requireUid(request.auth);
  const existing = await readStored(uid);
  if (!existing?.stripeCustomerId) throw new HttpsError('not-found', 'No hay facturación asociada a esta cuenta.');
  const session = await stripeClient().billingPortal.sessions.create({
    customer: existing.stripeCustomerId,
    return_url: `${siteUrl()}/cuenta`,
  });
  return { url: session.url };
});

const RELEVANT = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

function subscriptionIdFor(event: Stripe.Event): string | null {
  const object = event.data.object as unknown as Record<string, unknown>;
  if (event.type === 'checkout.session.completed') {
    return object.mode === 'subscription' && typeof object.subscription === 'string' ? object.subscription : null;
  }
  if (event.type.startsWith('invoice.')) return typeof object.subscription === 'string' ? object.subscription : null;
  return typeof object.id === 'string' ? object.id : null;
}

async function resolveUid(sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.firebase_uid;
  if (fromMetadata) return fromMetadata;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const found = await db().collection('subscriptions').where('stripeCustomerId', '==', customerId).limit(1).get();
  return found.docs[0]?.id ?? null;
}

export const stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('method not allowed');
    return;
  }
  const signature = req.header('stripe-signature');
  if (!signature) {
    res.status(400).send('missing signature');
    return;
  }

  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(req.rawBody, signature, STRIPE_WEBHOOK_SECRET.value(), undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    res.status(400).send('invalid signature');
    return;
  }
  if (!RELEVANT.has(event.type)) {
    res.status(200).send('ignored');
    return;
  }

  try {
    const subscriptionId = subscriptionIdFor(event);
    if (!subscriptionId) {
      res.status(200).send('no subscription');
      return;
    }
    // Siempre se vuelve a consultar: el estado vigente es el de Stripe, no el del evento.
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const uid = await resolveUid(sub);
    if (!uid) {
      console.error('webhook: suscripción sin usuario asociado', sub.id);
      res.status(200).send('unknown customer');
      return;
    }
    const record = recordFromStripe(sub as unknown as Parameters<typeof recordFromStripe>[0]);
    await db()
      .collection('subscriptions')
      .doc(uid)
      .set(
        { ...record, currentPeriodEnd: record.currentPeriodEnd ? Timestamp.fromDate(record.currentPeriodEnd) : null, updatedAt: Timestamp.now() },
        { merge: true },
      );
    res.status(200).send('ok');
  } catch (error) {
    // 5xx hace que Stripe reintente el evento.
    console.error('webhook error', event.type, error);
    res.status(500).send('processing error');
  }
});
