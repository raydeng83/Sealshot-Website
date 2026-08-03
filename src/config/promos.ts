/**
 * What the Buy button points at, and what price to show next to it.
 *
 * The founding tier is a SEPARATE Polar product, not a discount code. That is
 * forced by fulfilment: the Worker maps a Polar `product_id` to an update term
 * (`PRODUCT_MAP` in workers/license-fulfillment/wrangler.toml), and a
 * discounted purchase arrives with the same product_id as a full-price one —
 * so a coupon could not express "18 months instead of 12". One product per
 * term keeps the price the customer sees and the license they receive in sync.
 *
 * Prices here are DISPLAY ONLY. Polar is authoritative on what is charged, and
 * the Worker is authoritative on the update window.
 */

/**
 * ⚠️ These are SANDBOX checkout links. Real money is not involved and the
 * product ids they resolve to exist only in Polar's sandbox.
 *
 * At launch, all of the following must change together:
 *   1. the three URLs below, to their production equivalents
 *      (`api.polar.sh`, not `sandbox-api.polar.sh`)
 *   2. this flag, to false
 *   3. PRODUCT_MAP in the Worker, to the production product ids
 *   4. POLAR_WEBHOOK_SECRET, to the production endpoint's secret
 *
 * `tests/promos.test.ts` fails if this flag and the URLs disagree, so a
 * half-finished swap can't ship quietly. It cannot catch step 3 or 4.
 */
export const CHECKOUT_IS_SANDBOX = true;

export const REGULAR_PRICE_CENTS = 4900;
export const RENEWAL_PRICE_CENTS = 2400;

/** Months of updates included with the regular license. */
export const REGULAR_UPDATE_MONTHS = 12;

/** Full-price checkout — the fallback when no time-limited offer is running. */
export const BASE_CHECKOUT_URL =
  'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_FGg6cR9hQvHj6Ojx9XAZKx4zYUg4iQWklT8V52uIGai/redirect';

/**
 * Renewal checkout. The /renew page appends `reference_id=<licenseId>` and
 * `customer_email=<email>`; Polar copies both into the Checkout Session
 * metadata and then onto the order, which is how the Worker attaches the
 * renewal to an existing license instead of minting a new one.
 */
export const RENEWAL_CHECKOUT_URL =
  'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_6xX6nk2EJZhqLq2jmFoGlrOfSc5PVFYKHAUT80I1WzB/redirect';

export type Offer = {
  id: string;
  label: string;
  /** Polar checkout link for this offer's own product. */
  checkoutUrl: string;
  /** DISPLAY only — Polar is authoritative on the charge. */
  priceCents: number;
  /** Months of updates this product grants. Must match PRODUCT_MAP. */
  updateMonths: number;
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601, exclusive
};

export const OFFERS: Offer[] = [
  {
    id: 'founding',
    label: 'Founding price',
    checkoutUrl:
      'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_TYsHg17rjvhPYrCXOVtDSYKXLC1c9hZvSaCIm4W9y7y/redirect',
    priceCents: 3900,
    updateMonths: 18,
    startsAt: '2026-08-01T00:00:00Z',
    // TODO: this is a PLACEHOLDER. The founding tier is for buyers before the
    // 1.0 release, so this must be set to the actual v1.0 release day — not
    // left to expire on a date picked for convenience. Selling "founding"
    // after 1.0 ships means charging $39 for a tier that no longer exists.
    endsAt: '2027-01-01T00:00:00Z',
  },
];

/** The single active offer (first whose window contains `now`), or null. */
export function activeOffer(now: Date): Offer | null {
  const t = now.getTime();
  return OFFERS.find((o) => t >= Date.parse(o.startsAt) && t < Date.parse(o.endsAt)) ?? null;
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
