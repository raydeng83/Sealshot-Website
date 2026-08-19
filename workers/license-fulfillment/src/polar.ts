import { utf8ToBytes } from './base64';
import { normalizeLine } from './sanitize';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Standard Webhooks HMAC-SHA256 verification, as POLAR actually implements it.
 *
 * The spec says a secret is `whsec_` + base64, and the standardwebhooks library
 * strips that prefix and base64-DECODES the rest to get the key. Polar does not
 * hand it a spec-shaped secret. From polarsource/polar-js `src/webhooks.ts`:
 *
 *     const base64Secret = Buffer.from(secret, "utf-8").toString("base64");
 *     const webhook = new Webhook(base64Secret);
 *
 * It base64-ENCODES the whole dashboard secret first, which the library then
 * decodes straight back. So the HMAC key is the raw UTF-8 bytes of the secret
 * string exactly as the Polar dashboard shows it — `whsec_` prefix INCLUDED,
 * and no base64 decoding anywhere.
 *
 * Getting this wrong fails closed and looks like a mystery: every delivery
 * returns 401, and after 10 consecutive non-2xx Polar disables the endpoint and
 * later orders go silently unfulfilled.
 */
export async function verifyPolarSignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigHeader = headers.get('webhook-signature');
  if (!id || !ts || !sigHeader) return false;

  // Trim: a secret pasted into `wrangler secret put` can carry a trailing
  // newline, which would change every HMAC.
  const keyBytes = utf8ToBytes(secret.trim());
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${rawBody}`));
  let expected = '';
  const macBytes = new Uint8Array(mac);
  for (let i = 0; i < macBytes.length; i++) expected += String.fromCharCode(macBytes[i]);
  const expectedB64 = btoa(expected);

  // Header may contain multiple space-separated `v1,<sig>` entries.
  return sigHeader.split(' ').some((entry) => {
    const [, sig] = entry.split(',');
    return sig ? timingSafeEqual(sig, expectedB64) : false;
  });
}

export type ParsedOrder = {
  orderId: string;
  email: string;
  name: string;
  paidAtISO: string;
  /** Polar product id — maps to an update term via PRODUCT_MAP. */
  productId: string;
  /** The license this order renews, when the renewal page supplied one. */
  referenceId?: string;
  /** Billing address as rendered preamble lines; absent if Polar sent none. */
  addressLines?: string[];
};

/**
 * `reference_id` set on a checkout link is documented as being "attached to the
 * generated Checkout Session metadata", and checkout metadata is copied onto
 * the resulting order — but the key's casing inside `metadata` is not
 * documented, and Polar's own SDK docs describe it arriving as camelCase
 * `referenceId` while the link parameter is snake_case.
 *
 * Reading all three shapes costs one expression and makes the question moot.
 * Getting it wrong would silently drop every renewal to the email fallback,
 * which still works — so it would not fail visibly, it would just quietly
 * mis-handle the customer whose address changed.
 */
function extractReferenceId(d: any): string | undefined {
  const raw = d?.metadata?.reference_id ?? d?.metadata?.referenceId ?? d?.reference_id;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

/**
 * Render Polar's billing address into preamble lines.
 *
 * Two lines at most, because that is what an address needs to be legible in a
 * fixed-column block: the street, then everything that locates it.
 *
 *   1725 Revere Beach Pkwy,
 *   Everett, MA 02149, US
 *
 * Read from several candidate paths on purpose. Polar has carried the address on
 * both the order and its customer across API versions, and an order arriving
 * without one must not cost the buyer their license — an absent or unrecognised
 * shape yields undefined and the field is simply left out.
 */
export function normalizeAddress(d: any): string[] | undefined {
  const a = d?.billing_address ?? d?.customer?.billing_address ?? d?.customer_billing_address;
  if (!a || typeof a !== 'object') return undefined;
  const part = (v: unknown) => (typeof v === 'string' ? normalizeLine(v) : '');
  const street = [part(a.line1), part(a.line2)].filter(Boolean).join(', ');
  const region = [part(a.state), part(a.postal_code)].filter(Boolean).join(' ');
  const locality = [part(a.city), region, part(a.country)].filter(Boolean).join(', ');
  if (street && locality) return [street + ',', locality];
  const single = street || locality;
  return single ? [single] : undefined;
}

export function parseOrderPaid(rawBody: string): ParsedOrder | null {
  let evt: any;
  try { evt = JSON.parse(rawBody); } catch { return null; }
  if (evt?.type !== 'order.paid' || !evt?.data) return null;
  const d = evt.data;
  const email = d.customer?.email ?? d.customer_email;
  const name = d.customer?.name ?? d.customer_name ?? '';
  const orderId = d.id;
  const paidAtISO = d.created_at ?? d.paid_at;
  if (!email || !orderId || !paidAtISO) return null;
  // Absent product id resolves to the default terms rather than rejecting the
  // order — a buyer who paid must still get a license.
  const productId = d.product_id ?? d.product?.id ?? '';
  return {
    orderId, email, name, paidAtISO, productId,
    referenceId: extractReferenceId(d),
    addressLines: normalizeAddress(d),
  };
}

/**
 * A refund. Polar sends `order.refunded` separately from `order.paid`, so the
 * endpoint must subscribe to both — nothing here fires otherwise.
 *
 * Only the order id is needed: everything else about the purchase is already on
 * our own record, and the refund tells us nothing new about the buyer.
 */
export function parseOrderRefunded(rawBody: string): { orderId: string } | null {
  let evt: any;
  try { evt = JSON.parse(rawBody); } catch { return null; }
  if (evt?.type !== 'order.refunded' || !evt?.data?.id) return null;
  return { orderId: evt.data.id };
}
