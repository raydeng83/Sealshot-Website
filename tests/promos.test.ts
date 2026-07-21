import { describe, it, expect } from 'vitest';
import { activePromo, formatUSD, REGULAR_PRICE_CENTS } from '../src/config/promos';

describe('activePromo', () => {
  it('returns the launch promo inside its window', () => {
    const p = activePromo(new Date('2026-08-01T00:00:00Z'));
    expect(p?.id).toBe('launch-2026');
    expect(p?.priceCents).toBe(1499);
  });
  it('returns null before the window', () => {
    expect(activePromo(new Date('2026-01-01T00:00:00Z'))).toBeNull();
  });
  it('returns null after the window (endsAt exclusive)', () => {
    expect(activePromo(new Date('2030-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('formatUSD', () => {
  it('formats cents', () => {
    expect(formatUSD(2999)).toBe('$29.99');
    expect(formatUSD(1499)).toBe('$14.99');
  });
});

describe('constants', () => {
  it('regular price is $29.99', () => {
    expect(REGULAR_PRICE_CENTS).toBe(2999);
  });
});
