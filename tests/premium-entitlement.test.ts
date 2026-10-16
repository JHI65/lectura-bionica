import { describe, expect, it } from 'vitest';
import { entitlementFromDoc } from '../src/lib/auth/entitlement';
import { isPremiumRecord, planFrom, recordFromStripe, trialDaysFor } from '../functions/src/subscription';

const ts = (ms: number) => ({ toMillis: () => ms });
const NOW = 1_800_000_000_000;

describe('entitlementFromDoc (cliente)', () => {
  it('sin documento no hay Premium', () => {
    expect(entitlementFromDoc(undefined, NOW)).toEqual({ premium: false, status: null, cancelAtPeriodEnd: false, hadSubscription: false });
  });
  it('active y trialing dan Premium mientras el periodo no ha terminado', () => {
    expect(entitlementFromDoc({ status: 'active', currentPeriodEnd: ts(NOW + 1000) }, NOW).premium).toBe(true);
    expect(entitlementFromDoc({ status: 'trialing', currentPeriodEnd: ts(NOW + 1000) }, NOW).premium).toBe(true);
  });
  it('periodo terminado, past_due, canceled o sin fecha: no hay Premium', () => {
    expect(entitlementFromDoc({ status: 'active', currentPeriodEnd: ts(NOW - 1) }, NOW).premium).toBe(false);
    expect(entitlementFromDoc({ status: 'past_due', currentPeriodEnd: ts(NOW + 1000) }, NOW).premium).toBe(false);
    expect(entitlementFromDoc({ status: 'canceled', currentPeriodEnd: ts(NOW + 1000) }, NOW).premium).toBe(false);
    expect(entitlementFromDoc({ status: 'active', currentPeriodEnd: null }, NOW).premium).toBe(false);
  });
  it('la cancelación al final del periodo mantiene el acceso y se informa', () => {
    const e = entitlementFromDoc({ status: 'active', currentPeriodEnd: ts(NOW + 1000), cancelAtPeriodEnd: true }, NOW);
    expect(e).toEqual({ premium: true, status: 'active', cancelAtPeriodEnd: true, hadSubscription: false });
    expect(entitlementFromDoc({ status: 'canceled', stripeSubscriptionId: 'sub_1' }, NOW).hadSubscription).toBe(true);
  });
  it('un documento con tipos raros no concede Premium', () => {
    expect(entitlementFromDoc({ status: 5, currentPeriodEnd: ts(NOW + 1000) }, NOW).premium).toBe(false);
    expect(entitlementFromDoc({ status: 'active', currentPeriodEnd: {} }, NOW).premium).toBe(false);
  });
});

describe('servidor: reglas de suscripción', () => {
  it('misma regla que el cliente', () => {
    expect(isPremiumRecord({ status: 'active', currentPeriodEnd: new Date(NOW + 1000) }, NOW)).toBe(true);
    expect(isPremiumRecord({ status: 'past_due', currentPeriodEnd: new Date(NOW + 1000) }, NOW)).toBe(false);
    expect(isPremiumRecord({ status: 'active', currentPeriodEnd: new Date(NOW - 1000) }, NOW)).toBe(false);
    expect(isPremiumRecord(null, NOW)).toBe(false);
  });
  it('recordFromStripe lee el fin de periodo de la API antigua y de la nueva', () => {
    const old = recordFromStripe({ id: 's1', status: 'active', customer: 'c1', current_period_end: 1_800_000_000, items: { data: [{ price: { id: 'p1' } }] } });
    expect(old).toMatchObject({ stripeCustomerId: 'c1', stripeSubscriptionId: 's1', priceId: 'p1', cancelAtPeriodEnd: false });
    expect(old.currentPeriodEnd?.getTime()).toBe(1_800_000_000_000);
    const modern = recordFromStripe({ id: 's2', status: 'trialing', customer: { id: 'c2' }, cancel_at_period_end: true, items: { data: [{ price: { id: 'p2' }, current_period_end: 1_800_000_100 }] } });
    expect(modern.currentPeriodEnd?.getTime()).toBe(1_800_000_100_000);
    expect(modern).toMatchObject({ stripeCustomerId: 'c2', cancelAtPeriodEnd: true });
  });
  it('el plan solo puede ser mensual o anual', () => {
    expect(planFrom('yearly')).toBe('yearly');
    expect(planFrom('lo-que-sea')).toBe('monthly');
    expect(planFrom(undefined)).toBe('monthly');
  });
  it('la prueba gratuita solo se da la primera vez y con un valor válido', () => {
    expect(trialDaysFor(false, '7')).toBe(7);
    expect(trialDaysFor(false, undefined)).toBe(7);
    expect(trialDaysFor(true, '7')).toBeNull();
    expect(trialDaysFor(false, '0')).toBeNull();
    expect(trialDaysFor(false, 'abc')).toBeNull();
    expect(trialDaysFor(false, '365')).toBeNull();
  });
});
