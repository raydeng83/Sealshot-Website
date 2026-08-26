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
 * PRODUCTION checkout links. Real cards, real money.
 *
 * `tests/promos.test.ts` fails if this flag and the URLs disagree, so the pair
 * cannot be half-swapped. What it still cannot see:
 *   - PRODUCT_MAP in the Worker. Both environments are mapped there now, so
 *     neither has an unmapped window; nothing to do at cutover.
 *   - POLAR_WEBHOOK_SECRET, which is single-valued and is therefore the thing
 *     that actually cuts over. Set to the production endpoint's secret, every
 *     sandbox webhook returns 401 — expected — and every production one
 *     verifies. Left on the sandbox secret, real orders 401 instead, and after
 *     about ten consecutive failures Polar disables the endpoint. Nothing in
 *     this repo can detect either state.
 *
 * `npm run check:prices` reads all three links back from Polar and picks its API
 * host from this flag, so it verifies production once this is false.
 *
 * The `/v1/checkout-links/<id>/redirect` form is used rather than the
 * `buy.polar.sh/<id>` URL the dashboard hands out. Both redirect to the same
 * checkout and both carry query parameters through (verified 2026-08-19), but
 * this is the shape the sandbox path was proven with.
 */
export const CHECKOUT_IS_SANDBOX = false;

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
  'https://api.polar.sh/v1/checkout-links/polar_cl_PoAdTGTzzEdfhMfOXEwOyeqr8LsCbPHHtJhTq0NZfoi/redirect';

/**
 * Renewal checkout. The /renew page appends `reference_id=<licenseId>` and
 * `customer_email=<email>`. Both are documented checkout-link parameters and
 * Polar attaches them to the Checkout Session metadata, which propagates to the
 * order — that is how the Worker attaches a renewal to an existing license
 * instead of minting a new one.
 *
 * Note the public client endpoint (`/v1/checkouts/client/<secret>`) does NOT
 * echo metadata, so a probe there shows nothing and proves nothing. Only a real
 * renewal order confirms it end to end, and that is still unexercised by live
 * traffic — see docs/launch-checklist.md Phase 4.
 */
export const RENEWAL_CHECKOUT_URL =
  'https://api.polar.sh/v1/checkout-links/polar_cl_3FkZ8HQH1c9nD6pULAG4j270YACf4N3KlycHG0uPSaM/redirect';

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
      'https://api.polar.sh/v1/checkout-links/polar_cl_WzQoSv8rzAKQIfomkyGW4XTIZVibhvB6alATt3jUs64/redirect',
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

/*
 * There is no TRIAL_DAYS any more. Sealshot is free to use: every feature works,
 * nothing expires, and no capture is ever refused. What a license buys is the
 * update window above, and that the app's occasional support reminder stops.
 *
 * The constant was removed rather than set to 0 so that no page can render "free
 * for 0 days" — and so that anything still importing it fails the build instead
 * of quietly advertising a trial that does not exist.
 */
