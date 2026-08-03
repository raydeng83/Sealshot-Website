import { addMonthsUTC } from './license';

export type PurchaseKind = 'new' | 'renewal';
export type ProductTerms = { kind: PurchaseKind; months: number };

const DEFAULT_TERMS: ProductTerms = { kind: 'new', months: 12 };

/**
 * Polar product id → license terms, read from the PRODUCT_MAP var so adding a
 * product or changing a term is a config change rather than a deploy.
 *
 * An unknown product falls back to a 12-month NEW purchase. That direction is
 * deliberate: the buyer has paid, so they must get a working license, and
 * treating an unrecognised purchase as `new` mints a fresh license instead of
 * touching an existing one. The opposite default would let a misconfigured
 * product id rewrite a customer's window.
 */
export function resolveProduct(env: { PRODUCT_MAP?: string }, productId: string): ProductTerms {
  try {
    const map = JSON.parse(env.PRODUCT_MAP ?? '{}') as Record<string, ProductTerms>;
    const terms = map[productId];
    if (
      terms &&
      (terms.kind === 'new' || terms.kind === 'renewal') &&
      Number.isFinite(terms.months) &&
      terms.months > 0
    ) {
      return terms;
    }
  } catch {
    /* malformed map — fall through to the safe default */
  }
  return DEFAULT_TERMS;
}

/**
 * Whether this product id was actually configured, as opposed to landing on the
 * default.
 *
 * The fallback is deliberately silent so a buyer always gets a license, which
 * means a wholly wrong PRODUCT_MAP — sandbox ids left in place at launch being
 * the obvious one — produces correct-looking 12-month licenses forever and
 * never errors. Callers use this to alert, so the misconfiguration surfaces on
 * the first sale rather than at the first renewal a year later.
 */
export function isMappedProduct(env: { PRODUCT_MAP?: string }, productId: string): boolean {
  try {
    const map = JSON.parse(env.PRODUCT_MAP ?? '{}') as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(map, productId);
  } catch {
    return false;
  }
}

/**
 * The entire renewal date rule: extend from whichever is later, the existing
 * window or the purchase day.
 *
 * Renewing early keeps unused time (the customer is never punished for
 * renewing before they had to); renewing after a lapse starts from today
 * rather than back-dating months the customer didn't hold. One `max` covers
 * both cases in the v1.0 pricing document, §8.
 *
 * `yyyy-MM-dd` strings compare lexicographically in date order, so `>` is a
 * correct day comparison — no parsing, and no timezone to get wrong.
 */
export function renewalThrough(
  existingThrough: string,
  purchaseDay: string,
  months: number
): string {
  const base = existingThrough > purchaseDay ? existingThrough : purchaseDay;
  return addMonthsUTC(base, months);
}
