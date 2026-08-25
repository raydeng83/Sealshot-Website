/**
 * Does the promo code actually take money off?
 *
 *     PROMO_CODE=PRODUCTHUNT PROMO_CENTS=999 npm run check:promo
 *
 * Run this the moment the code exists in Polar, and again before the launch post
 * goes up. Skipped by `npm test`, because it needs the network.
 *
 * Why it exists: Polar SILENTLY IGNORES a discount code it cannot honour.
 * Measured against the live founding link — an invented code returns a perfectly
 * ordinary checkout at the full 1499 with `discount_amount: 0` and no error
 * anywhere. Every way a code can go wrong looks identical:
 *
 *   - a typo in the code, here or in the Product Hunt listing
 *   - an expiry that has passed, or a start date that has not arrived
 *   - max redemptions exhausted
 *   - the discount restricted to the regular product instead of Founding
 *   - the code deleted, or the product archived at 1.0
 *
 * In all of them the buyer reaches checkout, sees the undiscounted price, and
 * either pays more than promised or leaves. Nothing alerts anyone. So the check
 * asserts the discount is APPLIED, not merely that the link works.
 */
import { describe, it, expect } from 'vitest';
import { OFFERS, CHECKOUT_IS_SANDBOX } from '../src/config/promos';

const CODE = process.env.PROMO_CODE ?? 'PRODUCTHUNT';
/** What the buyer should be charged with the code applied. */
const EXPECTED = Number(process.env.PROMO_CENTS ?? 999);
/** Which offer the code is meant to discount. */
const OFFER_ID = process.env.PROMO_OFFER ?? 'founding';

const offer = OFFERS.find((o) => o.id === OFFER_ID);

type Checkout = {
  amount: number;
  discount_amount: number;
  subtotal_amount: number;
  product: { name: string };
  discount: unknown;
};

/** Follow a checkout link and read back what Polar would charge. */
async function checkout(url: string): Promise<Checkout> {
  const redirect = await fetch(url, { redirect: 'manual' });
  const location = redirect.headers.get('location');
  if (!location) throw new Error(`${url} did not redirect (${redirect.status})`);
  const secret = location.split('/checkout/')[1]?.split('?')[0];
  const host = CHECKOUT_IS_SANDBOX ? 'sandbox-api.polar.sh' : 'api.polar.sh';
  const res = await fetch(`https://${host}/v1/checkouts/client/${secret}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`checkout lookup failed: ${res.status}`);
  return (await res.json()) as Checkout;
}

describe.skipIf(!process.env.LIVE_POLAR)(`promo code ${CODE}`, () => {
  it('is applied, and takes the price to the advertised amount', async () => {
    expect(offer, `no offer called "${OFFER_ID}" in promos.ts`).toBeDefined();
    const withCode = await checkout(
      `${offer!.checkoutUrl}?discount_code=${encodeURIComponent(CODE)}`
    );

    // The message matters as much as the assertion: this is the failure someone
    // will be reading at 6am on launch day.
    expect(
      withCode.discount,
      `Polar ignored "${CODE}" — checkout is ${withCode.amount} cents with `
        + `discount_amount ${withCode.discount_amount}. An ignored code looks exactly `
        + `like a working one: check the spelling, the expiry and start date, the `
        + `redemption limit, and that the discount is restricted to `
        + `"${withCode.product.name}".`
    ).not.toBeNull();

    expect(withCode.amount).toBe(EXPECTED);
    expect(withCode.discount_amount).toBe(withCode.subtotal_amount - EXPECTED);
  }, 30_000);

  it('discounts the offer it is meant to, at the price the site advertises', async () => {
    // Guards the other direction: a code that "works" because the PRODUCT was
    // repriced, rather than because a discount applied, would otherwise pass.
    const plain = await checkout(offer!.checkoutUrl);
    expect(plain.amount).toBe(offer!.priceCents);
    expect(plain.discount_amount).toBe(0);
  }, 30_000);
});
