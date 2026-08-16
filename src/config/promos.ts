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

/**
 * DISPLAY ONLY, as the header says — Polar decides what a customer is charged.
 * Changing these without changing the Polar products means the site advertises one
 * price and the checkout takes another.
 *
 * The sandbox products now match: verified 2026-08-16 that Polar charges $29.99,
 * $14.99 and $17.99 on the three links below. Verify it rather than trust this
 * comment — `npm run check:prices` reads each checkout back from Polar — and run
 * it again after creating the production products.
 */
export const REGULAR_PRICE_CENTS = 2999;

/**
 * Renewal: 40% off a regular license — $17.99 today. Derived rather than typed
 * in, so the discount survives the next price change instead of drifting into
 * the near-full-price figure it was before ($24 against a $29.99 license).
 * Floored to the cent: 60% of $29.99 is $17.994.
 */
export const RENEWAL_PRICE_CENTS = Math.floor(REGULAR_PRICE_CENTS * 0.6);

/** Months of updates included with the regular license. */
export const REGULAR_UPDATE_MONTHS = 12;

/**
 * Months a renewal adds. Same number as the regular license today, but a
 * different fact — this one must match the renewal entry in the Worker's
 * PRODUCT_MAP, which is what actually extends the window.
 */
export const RENEWAL_UPDATE_MONTHS = 12;

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
    priceCents: 1499,
    updateMonths: 18,
    startsAt: '2026-08-01T00:00:00Z',
    // TODO: this is a PLACEHOLDER. The founding tier is for buyers before the
    // 1.0 release, so this must be set to the actual v1.0 release day — not
    // left to expire on a date picked for convenience. Selling "founding"
    // after 1.0 ships means charging the founding price for a tier that no
    // longer exists.
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

/**
 * Same price without a trailing `.00`. For running copy, where "$24.00 renewal"
 * reads worse than "$24 renewal". No current price is a whole dollar, so this is
 * a no-op today; it exists so one can be. The /buy page keeps the exact form,
 * since a headline price is where a customer checks the cents.
 */
export function formatUSDCompact(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : formatUSD(cents);
}

/**
 * Whole-percent discount an offer represents against the regular price. Computed
 * rather than written into copy, because "50% off" beside a pair of prices that
 * no longer divide that way is the kind of error nobody notices for months.
 */
export function savingsPercent(priceCents: number, regularCents = REGULAR_PRICE_CENTS): number {
  return Math.round((1 - priceCents / regularCents) * 100);
}

/**
 * Free-trial length, in days.
 *
 * Authoritative value is `LicenseKeys.trialDays` in the app repo — the binary
 * decides when a trial ends, not this file. Kept here because the marketing
 * pages cannot import across repos, so if that constant changes this one has to
 * be changed with it.
 */
export const TRIAL_DAYS = 14;
