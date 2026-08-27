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
/*
 * Sealshot is donation-supported. There is no price: the checkout is a Polar
 * pay-what-you-want product, so the buyer names the amount and Polar (still
 * merchant of record — tax, receipts) charges it. Every donation at or above
 * Polar's configured minimum issues the same permanent supporter license
 * through the existing Worker pipeline.
 *
 * SUGGESTED_CENTS is DISPLAY ONLY, like the prices before it: Polar's product
 * carries its own suggested amount, and the two have to be edited together or
 * the page hints one number and the checkout preselects another. The MINIMUM
 * lives only in Polar — the site never states it, because "donate at least $X"
 * reads as a price with extra steps.
 */
export const SUGGESTED_CENTS = 1500;

/*
 * TODO(donate-cutover): still the old fixed-price $29.99 product. Replace with
 * the pay-what-you-want checkout link once it exists in Polar, and add its
 * product id to the Worker's PRODUCT_MAP in the same change. Until then the
 * donate page takes real money at a fixed price, so it must not ship — the
 * placeholder is here only so the branch builds.
 */
export const DONATE_CHECKOUT_URL =
  'https://api.polar.sh/v1/checkout-links/polar_cl_PoAdTGTzzEdfhMfOXEwOyeqr8LsCbPHHtJhTq0NZfoi/redirect';

/*
 * The founding offer, the regular price, savingsPercent and activeOffer are
 * GONE rather than zeroed: against pay-what-you-want there is nothing to
 * discount and no price to compare, and anything still importing them should
 * fail the build instead of rendering a struck-through number beside a field
 * the visitor fills in themselves. This also finally retires the placeholder
 * endsAt that every offer-window decision kept tripping over.
 */

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Same amount without a trailing `.00`. The suggested donation is a whole
 * dollar figure, so "Most people give $15" reads as a sentence rather than an
 * invoice.
 */
export function formatUSDCompact(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : formatUSD(cents);
}
