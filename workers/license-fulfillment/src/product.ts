import { addMonthsUTC } from './license';

export type PurchaseKind = 'new' | 'renewal';
export type ProductTerms = { kind: PurchaseKind; months: number };

const DEFAULT_TERMS: ProductTerms = { kind: 'new', months: 12 };

/**
 * Polar product id → licence terms, read from the PRODUCT_MAP var so adding a
 * product or changing a term is a config change rather than a deploy.
 *
 * An unknown product falls back to a 12-month NEW purchase. That direction is
 * deliberate: the buyer has paid, so they must get a working licence, and
 * treating an unrecognised purchase as `new` mints a fresh licence instead of
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
