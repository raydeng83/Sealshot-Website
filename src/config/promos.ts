export const REGULAR_PRICE_CENTS = 2999;

// Base Polar checkout link (no discount). Replace <...> with the real product link in Task 12.
export const BASE_CHECKOUT_URL = 'https://buy.polar.sh/<product-checkout-id>';

export type Promo = {
  id: string;
  label: string;
  polarCheckoutUrl: string; // Polar checkout link with the discount pre-applied
  priceCents: number;       // DISPLAY only — Polar is authoritative on the charge
  startsAt: string;         // ISO 8601
  endsAt: string;           // ISO 8601, exclusive
};

// Add future promos by appending entries + creating the matching Polar discount.
export const PROMOS: Promo[] = [
  {
    id: 'launch-2026',
    label: 'Launch price',
    polarCheckoutUrl: 'https://buy.polar.sh/<product-checkout-id>?discount_code=LAUNCH',
    priceCents: 1499,
    startsAt: '2026-07-20T00:00:00Z',
    endsAt: '2026-09-01T00:00:00Z',
  },
];

/** The single active promo (first whose window contains `now`), or null. */
export function activePromo(now: Date): Promo | null {
  const t = now.getTime();
  return (
    PROMOS.find((p) => t >= Date.parse(p.startsAt) && t < Date.parse(p.endsAt)) ?? null
  );
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
