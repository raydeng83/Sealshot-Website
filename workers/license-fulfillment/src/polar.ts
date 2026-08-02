import { utf8ToBytes } from './base64';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Standard Webhooks HMAC-SHA256 verification (Polar). */
export async function verifyPolarSignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigHeader = headers.get('webhook-signature');
  if (!id || !ts || !sigHeader) return false;

  const secretB64 = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const keyBytes = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));
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
  /** The licence this order renews, when the renewal page supplied one. */
  referenceId?: string;
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
  // order — a buyer who paid must still get a licence.
  const productId = d.product_id ?? d.product?.id ?? '';
  return { orderId, email, name, paidAtISO, productId, referenceId: extractReferenceId(d) };
}
