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

export function parseOrderPaid(rawBody: string): { orderId: string; email: string; name: string; paidAtISO: string } | null {
  let evt: any;
  try { evt = JSON.parse(rawBody); } catch { return null; }
  if (evt?.type !== 'order.paid' || !evt?.data) return null;
  const d = evt.data;
  const email = d.customer?.email ?? d.customer_email;
  const name = d.customer?.name ?? d.customer_name ?? '';
  const orderId = d.id;
  const paidAtISO = d.created_at ?? d.paid_at;
  if (!email || !orderId || !paidAtISO) return null;
  return { orderId, email, name, paidAtISO };
}
