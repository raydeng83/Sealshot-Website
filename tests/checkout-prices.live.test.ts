/**
 * Is the donate checkout actually pay-what-you-want?
 *
 *     npm run check:prices
 *
 * Skipped by `npm test` (needs the network); run it after any change to the
 * Polar product or the link. What it guards: the site says "any amount", so a
 * checkout that turns out to carry a FIXED price is the site lying — which is
 * exactly the state of the placeholder link during the donate cutover, and why
 * this must pass before the page ships.
 *
 * Polar's client checkout exposes the pricing mode: a pay-what-you-want
 * product answers with `amount_type: "custom"` (fixed products say "fixed").
 */
import { describe, it, expect } from 'vitest';
import { DONATE_CHECKOUT_URL, CHECKOUT_IS_SANDBOX } from '../src/config/promos';

async function checkout(url: string) {
  const redirect = await fetch(url, { redirect: 'manual' });
  const location = redirect.headers.get('location');
  if (!location) throw new Error(`${url} did not redirect (${redirect.status})`);
  const secret = location.split('/checkout/')[1]?.split('?')[0];
  const host = CHECKOUT_IS_SANDBOX ? 'sandbox-api.polar.sh' : 'api.polar.sh';
  const res = await fetch(`https://${host}/v1/checkouts/client/${secret}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`checkout lookup failed: ${res.status}`);
  return (await res.json()) as {
    amount_type?: string;
    product: { name: string };
    product_price?: { amount_type?: string };
  };
}

describe.skipIf(!process.env.LIVE_POLAR)('the donate checkout', () => {
  it('lets the donor name the amount', async () => {
    const c = await checkout(DONATE_CHECKOUT_URL);
    const mode = c.amount_type ?? c.product_price?.amount_type;
    expect(
      mode,
      `"${c.product.name}" is not pay-what-you-want — the site promises "any ` +
        `amount" and this checkout would charge a fixed price. If this is the ` +
        `cutover placeholder, swap DONATE_CHECKOUT_URL for the PWYW link.`
    ).toBe('custom');
  }, 30_000);
});
