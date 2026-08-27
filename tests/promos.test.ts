import { describe, it, expect } from 'vitest';
import {
  SUGGESTED_CENTS,
  DONATE_CHECKOUT_URL,
  CHECKOUT_IS_SANDBOX,
  formatUSD,
  formatUSDCompact,
} from '../src/config/promos';
import * as promos from '../src/config/promos';

describe('formatUSD', () => {
  it('formats cents', () => {
    expect(formatUSD(2999)).toBe('$29.99');
    expect(formatUSD(1500)).toBe('$15.00');
    expect(formatUSDCompact(1500)).toBe('$15');
  });
});

describe('donation config', () => {
  it('suggests a round, compact amount', () => {
    // The suggestion renders through formatUSDCompact in running copy —
    // "Most people give $15" — so it must be a whole-dollar figure, or the
    // sentence grows cents it does not need.
    expect(SUGGESTED_CENTS % 100).toBe(0);
    expect(SUGGESTED_CENTS).toBeGreaterThan(0);
  });

  it('has a Polar checkout link over https', () => {
    expect(DONATE_CHECKOUT_URL).toMatch(/^https:\/\/(sandbox-)?api\.polar\.sh\//);
  });

  it('agrees with CHECKOUT_IS_SANDBOX', () => {
    expect(DONATE_CHECKOUT_URL.includes('sandbox-api.polar.sh')).toBe(CHECKOUT_IS_SANDBOX);
  });

  it('has no prices, offers or windows left to advertise', () => {
    // Donation-supported: there is nothing to discount and no price to
    // compare. These exports are GONE rather than zeroed so a page still
    // reaching for one fails the build instead of rendering a struck-through
    // number beside a field the visitor fills in themselves.
    for (const name of [
      'REGULAR_PRICE_CENTS', 'OFFERS', 'activeOffer', 'savingsPercent',
      'BASE_CHECKOUT_URL', 'RENEWAL_PRICE_CENTS', 'TRIAL_DAYS',
    ]) {
      expect(promos, `${name} is back — donation-supported leaves it nothing to mean`)
        .not.toHaveProperty(name);
    }
  });
});
