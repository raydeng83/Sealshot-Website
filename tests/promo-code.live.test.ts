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

/**
 * Polar's amount fields, and which one is the money:
 *   amount           the product's BASE price — stays 1499 even when discounted
 *   discount_amount  what came off
 *   subtotal_amount  amount − discount
 *   total_amount     what the buyer pays (subtotal + tax)
 *
 * The first version of this file asserted on `amount` and would have failed
 * against a discount that was working perfectly.
 */
type Checkout = {
  amount: number;
  discount_amount: number;
  subtotal_amount: number;
  total_amount: number;
  product: { name: string };
  discount: { code?: string } | null;
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

    expect(withCode.total_amount, 'the payable total, not the base price').toBe(EXPECTED);
    expect(withCode.discount_amount).toBe(withCode.amount - EXPECTED);
  }, 30_000);

  it('does not discount the link the SITE uses', async () => {
    // The failure this exists for, met on 2026-08-25: setting the discount as the
    // Preset discount on the site's own founding link attached it to every
    // checkout that link creates. The site advertised $14.99 and charged $9.99 to
    // everyone, and the launch had nothing exclusive left to offer. A preset
    // belongs on a SEPARATE link used only in the listing.
    const plain = await checkout(offer!.checkoutUrl);
    expect(
      plain.discount,
      `the site's ${OFFER_ID} link has a discount attached (${plain.discount?.code ?? '—'}), `
        + `so every visitor pays ${plain.total_amount} instead of ${offer!.priceCents}. `
        + `Clear "Preset discount" on that link and put it on a launch-only link.`
    ).toBeNull();
    expect(plain.total_amount).toBe(offer!.priceCents);
    expect(plain.discount_amount).toBe(0);
  }, 30_000);
});
