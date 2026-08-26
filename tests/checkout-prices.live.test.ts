/**
 * Does Polar charge what the site advertises?
 *
 *     npm run check:prices
 *
 * Skipped by `npm test`, because it needs the network. Not because it is
 * optional: the comments in promos.ts and the Worker's wrangler.toml both used
 * to say "nothing in this repo can detect that mismatch", and a stale claim
 * about the prices survived several edits on the strength of that. It is
 * detectable — a checkout link redirects to a session whose amount is readable
 * from Polar's public client endpoint, no API key involved.
 *
 * Each run creates checkout sessions (unpaid, and in sandbox while
 * CHECKOUT_IS_SANDBOX is true). That is the cost of asking the question, and it
 * is why this is a command you run rather than part of the suite.
 */
import { describe, it, expect } from 'vitest';
import {
  OFFERS,
  BASE_CHECKOUT_URL,
  REGULAR_PRICE_CENTS,
  CHECKOUT_IS_SANDBOX,
} from '../src/config/promos';

/** Follow a checkout link and read back what Polar would actually charge. */
async function charged(checkoutUrl: string) {
  const redirect = await fetch(checkoutUrl, { redirect: 'manual' });
  const location = redirect.headers.get('location');
  if (!location) {
    throw new Error(`${checkoutUrl} did not redirect (${redirect.status})`);
  }
  // …/checkout/<client_secret> — the secret is what the public endpoint takes.
  const clientSecret = location.split('/checkout/')[1];
  // The API host has to match the link's environment, or the secret is unknown.
  const apiHost = CHECKOUT_IS_SANDBOX ? 'sandbox-api.polar.sh' : 'api.polar.sh';
  const res = await fetch(`https://${apiHost}/v1/checkouts/client/${clientSecret}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`checkout lookup failed: ${res.status}`);
  const body = (await res.json()) as {
    amount: number; currency: string; product_id: string; product: { name: string };
  };
  return body;
}

// No renewal row: updates are permanent, so the renewal product has nothing to
// sell and the site no longer links to it. It stays alive in Polar (and mapped in
// the Worker) only until it is archived.
const cases: Array<[string, string, number]> = [
  ['regular', BASE_CHECKOUT_URL, REGULAR_PRICE_CENTS],
  ...OFFERS.map((o) => [o.id, o.checkoutUrl, o.priceCents] as [string, string, number]),
];

describe.skipIf(!process.env.LIVE_POLAR)('what Polar charges', () => {
  for (const [name, url, advertised] of cases) {
    it(`${name}: charges the advertised ${advertised} cents`, async () => {
      const c = await charged(url);
      // Reported on failure, since "2999 !== 3900" alone does not say which
      // Polar product is wrong.
      expect({ product: c.product.name, id: c.product_id, amount: c.amount, currency: c.currency })
        .toMatchObject({ amount: advertised, currency: 'usd' });
    }, 30_000);
  }
});
