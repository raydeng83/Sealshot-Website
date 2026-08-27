import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveProduct, renewalThrough } from '../src/product';

// Vestigial since updates became permanent: nothing on sale has a window to
// extend. Kept because the renewal product still exists in Polar, so the path is
// still reachable until it is archived.
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
  const PERMANENT = { kind: 'new', permanent: true };
  const env = {
    PRODUCT_MAP:
      '{"prod_new":{"kind":"new","permanent":true},' +
      '"prod_found":{"kind":"new","permanent":true},' +
      '"prod_renew":{"kind":"renewal","permanent":true},' +
      '"prod_legacy":{"kind":"new","months":18}}',
  };
  it('maps configured products', () => {
    expect(resolveProduct(env, 'prod_found')).toEqual({ kind: 'new', permanent: true });
    expect(resolveProduct(env, 'prod_renew')).toEqual({ kind: 'renewal', permanent: true });
  });
  it('still honours a dated entry, for terms issued before updates were permanent', () => {
    expect(resolveProduct(env, 'prod_legacy')).toEqual({ kind: 'new', months: 18 });
  });
  it('falls back to a PERMANENT new purchase for an unknown product', () => {
    // The direction matters: the buyer has paid, so the fallback must err in
    // their favour, and permanent is what every live product grants.
    expect(resolveProduct(env, 'prod_mystery')).toEqual(PERMANENT);
  });
  it('falls back when the map is missing or malformed', () => {
    expect(resolveProduct({}, 'anything')).toEqual(PERMANENT);
    expect(resolveProduct({ PRODUCT_MAP: 'not json' }, 'x')).toEqual(PERMANENT);
    expect(resolveProduct({ PRODUCT_MAP: '[]' }, 'x')).toEqual(PERMANENT);
  });
  it('rejects entries with a bad kind or a non-positive term', () => {
    // A typo in PRODUCT_MAP must degrade to the safe default rather than
    // producing a license with a zero- or negative-length update window.
    // `{months: 0}` is in here on purpose: it is the plausible way someone
    // would try to spell "no expiry", and it must NOT be read as permanent —
    // it would otherwise mint a license covering nothing.
    const bad = {
      PRODUCT_MAP:
        '{"a":{"kind":"gift","months":12},"b":{"kind":"new","months":0},' +
        '"c":{"kind":"renewal","months":-12},"d":{"kind":"new"},' +
        '"e":{"kind":"new","permanent":"yes"}}',
    };
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(resolveProduct(bad, id)).toEqual(PERMANENT);
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
    // Seven: three sandbox ids, three retired production ids, and the live
    // pay-what-you-want Support Sealshot product. Retired ids stay mapped so a
    // straggling order fulfills instead of tripping the unmapped alert.
    expect(Object.keys(JSON.parse(raw!)).length).toBe(7);
  });

  it('maps every configured id to terms resolveProduct accepts', () => {
    // An entry that parses but fails validation is indistinguishable at runtime
    // from an unmapped product.
    for (const id of Object.keys(JSON.parse(raw!))) {
      const terms = resolveProduct(env, id);
      expect(['new', 'renewal']).toContain(terms.kind);
      expect(terms.permanent === true || (terms.months ?? 0) > 0).toBe(true);
    }
  });

  it('maps the live pay-what-you-want product', () => {
    // The donation cutover in one assertion: the id the donate checkout sells
    // resolves to a permanent new license. Wrong or missing, every donor gets
    // the fallback (also permanent — but the alert fires on every sale).
    expect(resolveProduct(env, 'e6f4da17-79c5-4632-b94b-51ccf0708aef'))
      .toEqual({ kind: 'new', permanent: true });
  });

  it('grants permanent updates on every product, in both environments', () => {
    // The failure this catches: one id left on a month count after the switch,
    // which parses, validates, and quietly sells a windowed license at the
    // price of a permanent one. Counting shapes rather than ids also catches a
    // renewal mapped as `new`.
    const values = Object.values(JSON.parse(raw!)) as { kind: string; permanent?: boolean }[];
    const shape = (v: { kind: string; permanent?: boolean }) =>
      `${v.kind}/${v.permanent === true ? 'permanent' : 'windowed'}`;
    const counts = new Map<string, number>();
    for (const v of values) counts.set(shape(v), (counts.get(shape(v)) ?? 0) + 1);
    expect([...counts.entries()].sort()).toEqual([
      ['new/permanent', 5],
      ['renewal/permanent', 2],
    ]);
  });
});
