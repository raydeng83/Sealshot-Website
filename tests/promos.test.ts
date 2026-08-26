import { describe, it, expect } from 'vitest';
import {
  activeOffer,
  formatUSD,
  OFFERS,
  REGULAR_PRICE_CENTS,
  savingsPercent,
  BASE_CHECKOUT_URL,
  CHECKOUT_IS_SANDBOX,
} from '../src/config/promos';
import * as promos from '../src/config/promos';

describe('activeOffer', () => {
  it('returns the founding offer inside its window', () => {
    const o = activeOffer(new Date('2026-09-01T00:00:00Z'));
    expect(o?.id).toBe('founding');
    expect(o?.priceCents).toBe(1499);
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
    expect(formatUSD(2999)).toBe('$29.99');
    expect(formatUSD(1499)).toBe('$14.99');
    expect(formatUSD(1799)).toBe('$17.99');
    expect(formatUSD(2400)).toBe('$24.00');   // a whole-dollar amount still formats
  });
});

describe('savingsPercent', () => {
  it('states the discount the pages advertise', () => {
    expect(savingsPercent(1499, 2999)).toBe(50);
    expect(savingsPercent(2999, 2999)).toBe(0);
  });

  it('matches the live founding offer, so the bar cannot claim a stale figure', () => {
    for (const o of OFFERS) {
      const pct = savingsPercent(o.priceCents);
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThan(100);
    }
  });
});

describe('prices', () => {
  it('match the v1.0 pricing document', () => {
    expect(REGULAR_PRICE_CENTS).toBe(2999);
  });

  it('never shows an offer that costs more than the regular price', () => {
    // A "Founding price" badge above a higher number would be absurd, and it is
    // exactly what a hurried price edit produces.
    for (const o of OFFERS) expect(o.priceCents).toBeLessThan(REGULAR_PRICE_CENTS);
  });

  it('has no update windows or renewal price left to advertise', () => {
    // Updates are permanent on every product. These exports are GONE rather
    // than zeroed, so a page still reaching for a month count fails the build
    // instead of rendering "0 months of updates" or a renewal price for a
    // renewal that no longer exists.
    for (const name of [
      'REGULAR_UPDATE_MONTHS', 'RENEWAL_UPDATE_MONTHS', 'RENEWAL_PRICE_CENTS',
      'RENEWAL_CHECKOUT_URL', 'TRIAL_DAYS',
    ]) {
      expect(promos, `${name} is back — permanent updates leave it nothing to mean`)
        .not.toHaveProperty(name);
    }
    for (const o of OFFERS) expect(o).not.toHaveProperty('updateMonths');
  });
});

describe('checkout links', () => {
  const all = [BASE_CHECKOUT_URL, ...OFFERS.map((o) => o.checkoutUrl)];

  it('are all Polar links over https', () => {
    for (const url of all) expect(url).toMatch(/^https:\/\/(sandbox-)?api\.polar\.sh\//);
  });

  it('are distinct — one product per link', () => {
    // A shared link would sell the wrong product at the wrong price.
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
