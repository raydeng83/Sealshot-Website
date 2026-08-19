import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveProduct, renewalThrough } from '../src/product';

describe('renewalThrough', () => {
  // Both headline cases come from the v1.0 pricing document, §8.
  it('early renewal keeps unused time', () => {
    expect(renewalThrough('2027-09-15', '2027-08-01', 12)).toBe('2028-09-15');
  });
  it('a lapsed license renews from the purchase day', () => {
    expect(renewalThrough('2027-09-15', '2028-03-01', 12)).toBe('2029-03-01');
  });
  it('renewing on the last covered day still extends from that day', () => {
    expect(renewalThrough('2027-09-15', '2027-09-15', 12)).toBe('2028-09-15');
  });
  it('handles a founding license renewing at 18 months', () => {
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
    // producing a license with a zero- or negative-length update window.
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

describe('the deployed PRODUCT_MAP', () => {
  // resolveProduct swallows a parse error and returns the safe default, so a
  // typo in wrangler.toml's JSON string would degrade EVERY purchase to 12
  // months without a single error anywhere. This is the only check that sees it.
  const toml = readFileSync(join(__dirname, '..', 'wrangler.toml'), 'utf8');
  const raw = /^PRODUCT_MAP\s*=\s*'(.*)'$/m.exec(toml)?.[1];
  const env = { PRODUCT_MAP: raw };

  it('is present in wrangler.toml', () => {
    expect(raw).toBeTruthy();
  });

  it('parses, rather than silently falling back to the default', () => {
    expect(() => JSON.parse(raw!)).not.toThrow();
    // Six: the three sandbox ids and the three production ones, both mapped so
    // neither environment has an unmapped window during the cutover. Drops back
    // to three when the sandbox products are retired.
    expect(Object.keys(JSON.parse(raw!)).length).toBe(6);
  });

  it('maps every configured id to terms resolveProduct accepts', () => {
    // An entry that parses but fails validation is indistinguishable at runtime
    // from an unmapped product.
    for (const id of Object.keys(JSON.parse(raw!))) {
      const terms = resolveProduct(env, id);
      expect(terms.months).toBeGreaterThan(0);
      expect(['new', 'renewal']).toContain(terms.kind);
    }
  });

  it('covers the same three terms in each environment, and nothing else', () => {
    const values = Object.values(JSON.parse(raw!)) as { kind: string; months: number }[];
    // One renewal and one of each new term per environment. Counting shapes
    // rather than ids is what catches the mistake that matters: a founding id
    // mapped to 12 months, or a renewal mapped as `new`, both of which parse
    // and validate and quietly sell the wrong thing.
    const shape = (v: { kind: string; months: number }) => `${v.kind}/${v.months}`;
    const counts = new Map<string, number>();
    for (const v of values) counts.set(shape(v), (counts.get(shape(v)) ?? 0) + 1);
    expect([...counts.entries()].sort()).toEqual([
      ['new/12', 2],
      ['new/18', 2],
      ['renewal/12', 2],
    ]);
  });
});
