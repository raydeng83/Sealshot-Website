import { describe, it, expect } from 'vitest';
import {
  activeOffer,
  formatUSD,
  OFFERS,
  REGULAR_PRICE_CENTS,
  RENEWAL_PRICE_CENTS,
  REGULAR_UPDATE_MONTHS,
  BASE_CHECKOUT_URL,
  RENEWAL_CHECKOUT_URL,
  CHECKOUT_IS_SANDBOX,
} from '../src/config/promos';

describe('activeOffer', () => {
  it('returns the founding offer inside its window', () => {
    const o = activeOffer(new Date('2026-09-01T00:00:00Z'));
    expect(o?.id).toBe('founding');
    expect(o?.priceCents).toBe(1499);
    expect(o?.updateMonths).toBe(18);
  });
  it('returns null before the window', () => {
    expect(activeOffer(new Date('2026-01-01T00:00:00Z'))).toBeNull();
  });
  it('returns null after the window (endsAt exclusive)', () => {
    expect(activeOffer(new Date('2030-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('formatUSD', () => {
  it('formats cents', () => {
    expect(formatUSD(4900)).toBe('$49.00');
    expect(formatUSD(3900)).toBe('$39.00');
    expect(formatUSD(2400)).toBe('$24.00');
  });
});

describe('prices', () => {
  it('match the v1.0 pricing document', () => {
    expect(REGULAR_PRICE_CENTS).toBe(2999);
    expect(RENEWAL_PRICE_CENTS).toBe(1799);   // 40% off, see the note in promos.ts
    expect(REGULAR_UPDATE_MONTHS).toBe(12);
  });

  it('keeps renewal a real discount on a whole new license', () => {
    // Not merely cheaper: renewing has to be visibly worth it, or the page is
    // asking near full price for updates alone. It sat a penny under regular
    // once, which is how that happens.
    expect(RENEWAL_PRICE_CENTS).toBeLessThan(REGULAR_PRICE_CENTS);
    expect(RENEWAL_PRICE_CENTS / REGULAR_PRICE_CENTS).toBeCloseTo(0.6, 2);
  });

  it('never shows an offer that costs more than the regular price', () => {
    // A "Founding price" badge above a higher number would be absurd, and it is
    // exactly what a hurried price edit produces.
    for (const o of OFFERS) expect(o.priceCents).toBeLessThan(REGULAR_PRICE_CENTS);
  });

  it('gives every offer at least as many update months as the regular license', () => {
    // Founding is cheaper AND longer. An offer that were shorter would have the
    // /buy page advertising a downgrade as a deal.
    for (const o of OFFERS) expect(o.updateMonths).toBeGreaterThanOrEqual(REGULAR_UPDATE_MONTHS);
  });
});

describe('checkout links', () => {
  const all = [BASE_CHECKOUT_URL, RENEWAL_CHECKOUT_URL, ...OFFERS.map((o) => o.checkoutUrl)];

  it('are all Polar links over https', () => {
    for (const url of all) expect(url).toMatch(/^https:\/\/(sandbox-)?api\.polar\.sh\//);
  });

  it('are distinct — one product per link', () => {
    // A shared link would sell the wrong update term at the wrong price.
    expect(new Set(all).size).toBe(all.length);
  });

  it('agree with CHECKOUT_IS_SANDBOX', () => {
    // Catches a half-finished launch swap in either direction: production URLs
    // still flagged sandbox, or the flag flipped while a sandbox URL remains.
    // It cannot catch a stale PRODUCT_MAP or webhook secret — see promos.ts.
    const anySandbox = all.some((url) => url.includes('sandbox-api.polar.sh'));
    expect(anySandbox).toBe(CHECKOUT_IS_SANDBOX);
  });
});
