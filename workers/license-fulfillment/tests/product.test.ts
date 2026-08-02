import { describe, it, expect } from 'vitest';
import { resolveProduct, renewalThrough } from '../src/product';

describe('renewalThrough', () => {
  // Both headline cases come from the v1.0 pricing document, §8.
  it('early renewal keeps unused time', () => {
    expect(renewalThrough('2027-09-15', '2027-08-01', 12)).toBe('2028-09-15');
  });
  it('a lapsed licence renews from the purchase day', () => {
    expect(renewalThrough('2027-09-15', '2028-03-01', 12)).toBe('2029-03-01');
  });
  it('renewing on the last covered day still extends from that day', () => {
    expect(renewalThrough('2027-09-15', '2027-09-15', 12)).toBe('2028-09-15');
  });
  it('handles a founding licence renewing at 18 months', () => {
    expect(renewalThrough('2028-01-31', '2027-06-01', 18)).toBe('2029-07-31');
  });
  it('never shortens an existing window', () => {
    // The property that matters more than any single date: a renewal is a
    // purchase, so it can only ever move the window forward.
    for (const purchaseDay of ['2026-01-01', '2027-09-14', '2027-09-15', '2030-06-30']) {
      expect(renewalThrough('2027-09-15', purchaseDay, 12) > '2027-09-15').toBe(true);
    }
  });
});

describe('resolveProduct', () => {
  const env = {
    PRODUCT_MAP:
      '{"prod_new":{"kind":"new","months":12},' +
      '"prod_found":{"kind":"new","months":18},' +
      '"prod_renew":{"kind":"renewal","months":12}}',
  };
  it('maps configured products', () => {
    expect(resolveProduct(env, 'prod_found')).toEqual({ kind: 'new', months: 18 });
    expect(resolveProduct(env, 'prod_renew')).toEqual({ kind: 'renewal', months: 12 });
  });
  it('falls back to a 12-month new purchase for an unknown product', () => {
    expect(resolveProduct(env, 'prod_mystery')).toEqual({ kind: 'new', months: 12 });
  });
  it('falls back when the map is missing or malformed', () => {
    expect(resolveProduct({}, 'anything')).toEqual({ kind: 'new', months: 12 });
    expect(resolveProduct({ PRODUCT_MAP: 'not json' }, 'x')).toEqual({ kind: 'new', months: 12 });
    expect(resolveProduct({ PRODUCT_MAP: '[]' }, 'x')).toEqual({ kind: 'new', months: 12 });
  });
  it('rejects entries with a bad kind or a non-positive term', () => {
    // A typo in PRODUCT_MAP must degrade to the safe default rather than
    // producing a licence with a zero- or negative-length update window.
    const bad = {
      PRODUCT_MAP:
        '{"a":{"kind":"gift","months":12},"b":{"kind":"new","months":0},' +
        '"c":{"kind":"renewal","months":-12},"d":{"kind":"new"}}',
    };
    for (const id of ['a', 'b', 'c', 'd']) {
      expect(resolveProduct(bad, id)).toEqual({ kind: 'new', months: 12 });
    }
  });
});
