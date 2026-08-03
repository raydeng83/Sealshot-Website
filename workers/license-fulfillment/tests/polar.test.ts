import { describe, it, expect } from 'vitest';
import { verifyPolarSignature, parseOrderPaid } from '../src/polar';
import { bytesToBase64, utf8ToBytes } from '../src/base64';

/**
 * Signs exactly the way Polar does — mirroring polarsource/polar-js:
 *
 *     const base64Secret = Buffer.from(secret, "utf-8").toString("base64");
 *     new Webhook(base64Secret)   // library base64-decodes it straight back
 *
 * so the HMAC key is the raw UTF-8 bytes of the dashboard secret, prefix and
 * all. Written the long way round on purpose: it is the round trip that makes
 * the `whsec_` prefix part of the key rather than a discarded marker.
 */
async function signLikePolar(secret: string, id: string, ts: string, body: string): Promise<string> {
  const base64Secret = bytesToBase64(utf8ToBytes(secret));
  const keyBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return bytesToBase64(new Uint8Array(mac));
}

// Shaped like a real Polar sandbox secret.
const SECRET = 'whsec_sandbox_C2vJ8pQ4mN7xR1tY6wZ3aB5dF9gH0kL2';

describe('verifyPolarSignature', () => {
  const ID = 'msg_1';
  const TS = '1721470000';
  const BODY = '{"type":"order.paid"}';

  const headersFor = (sig: string) =>
    new Headers({ 'webhook-id': ID, 'webhook-timestamp': TS, 'webhook-signature': `v1,${sig}` });

  it('accepts a body signed the way Polar signs it', async () => {
    const sig = await signLikePolar(SECRET, ID, TS, BODY);
    expect(await verifyPolarSignature(BODY, headersFor(sig), SECRET)).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const sig = await signLikePolar(SECRET, ID, TS, BODY);
    expect(await verifyPolarSignature('{"type":"evil"}', headersFor(sig), SECRET)).toBe(false);
  });

  it('rejects a signature bound to a different message id', async () => {
    // The id is part of the signed string, so a replay under a new id fails.
    const sig = await signLikePolar(SECRET, 'msg_OTHER', TS, BODY);
    expect(await verifyPolarSignature(BODY, headersFor(sig), SECRET)).toBe(false);
  });

  it('rejects a signature bound to a different timestamp', async () => {
    const sig = await signLikePolar(SECRET, ID, '1721479999', BODY);
    expect(await verifyPolarSignature(BODY, headersFor(sig), SECRET)).toBe(false);
  });

  it('treats the whsec_ prefix as part of the key, not a marker to strip', async () => {
    // This is the bug that made every live delivery 401: stripping the prefix
    // (or base64-decoding the remainder) yields a different key entirely.
    const sig = await signLikePolar(SECRET, ID, TS, BODY);
    const stripped = SECRET.slice('whsec_'.length);
    expect(await verifyPolarSignature(BODY, headersFor(sig), stripped)).toBe(false);
  });

  it('tolerates a trailing newline on the stored secret', async () => {
    // `wrangler secret put` can capture one from a paste.
    const sig = await signLikePolar(SECRET, ID, TS, BODY);
    expect(await verifyPolarSignature(BODY, headersFor(sig), `${SECRET}\n`)).toBe(true);
  });

  it('accepts a secret with no whsec_ prefix at all', async () => {
    // Polar lets you set your own secret, which need not be prefixed.
    const plain = 'my-own-chosen-secret';
    const sig = await signLikePolar(plain, ID, TS, BODY);
    expect(await verifyPolarSignature(BODY, headersFor(sig), plain)).toBe(true);
  });

  it('accepts when several space-separated signatures are offered', async () => {
    // Standard Webhooks allows multiple versions during a secret rotation.
    const sig = await signLikePolar(SECRET, ID, TS, BODY);
    const headers = new Headers({
      'webhook-id': ID, 'webhook-timestamp': TS,
      'webhook-signature': `v1,AAAAinvalidAAAA= v1,${sig}`,
    });
    expect(await verifyPolarSignature(BODY, headers, SECRET)).toBe(true);
  });

  it('rejects when a required header is missing', async () => {
    const sig = await signLikePolar(SECRET, ID, TS, BODY);
    for (const drop of ['webhook-id', 'webhook-timestamp', 'webhook-signature']) {
      const h = headersFor(sig);
      h.delete(drop);
      expect(await verifyPolarSignature(BODY, h, SECRET)).toBe(false);
    }
  });
});

describe('parseOrderPaid', () => {
  const evt = (data: Record<string, unknown>) =>
    JSON.stringify({
      type: 'order.paid',
      data: {
        id: 'ord_123',
        created_at: '2026-07-20T10:00:00Z',
        customer: { email: 'buyer@example.com', name: 'Buy Er' },
        ...data,
      },
    });

  it('extracts order id, email, name, paid date and product id', () => {
    expect(parseOrderPaid(evt({ product_id: 'prod_1' }))).toEqual({
      orderId: 'ord_123',
      email: 'buyer@example.com',
      name: 'Buy Er',
      paidAtISO: '2026-07-20T10:00:00Z',
      productId: 'prod_1',
      referenceId: undefined,
    });
  });

  it('falls back to a nested product object for the id', () => {
    expect(parseOrderPaid(evt({ product: { id: 'prod_2' } }))?.productId).toBe('prod_2');
  });

  it('yields an empty product id rather than rejecting an order with none', () => {
    // A buyer who paid must still get a license; PRODUCT_MAP's default covers it.
    expect(parseOrderPaid(evt({}))?.productId).toBe('');
  });

  describe('reference_id', () => {
    // Polar documents reference_id as reaching the Checkout Session metadata,
    // and checkout metadata as being copied onto the order — but not the key's
    // casing. All three observed shapes are accepted so the answer can't matter.
    it('reads metadata.reference_id', () => {
      expect(parseOrderPaid(evt({ metadata: { reference_id: 'LIC-1' } }))?.referenceId)
        .toBe('LIC-1');
    });
    it('reads metadata.referenceId', () => {
      expect(parseOrderPaid(evt({ metadata: { referenceId: 'LIC-1' } }))?.referenceId)
        .toBe('LIC-1');
    });
    it('reads a top-level reference_id', () => {
      expect(parseOrderPaid(evt({ reference_id: 'LIC-1' }))?.referenceId).toBe('LIC-1');
    });
    it('prefers snake_case metadata when both are present', () => {
      const r = parseOrderPaid(
        evt({ metadata: { reference_id: 'SNAKE', referenceId: 'CAMEL' } })
      )?.referenceId;
      expect(r).toBe('SNAKE');
    });
    it('trims surrounding whitespace', () => {
      expect(parseOrderPaid(evt({ metadata: { reference_id: '  LIC-1 ' } }))?.referenceId)
        .toBe('LIC-1');
    });
    it('treats blank or non-string values as absent', () => {
      // An empty reference must fall through to the email path, not become a
      // lookup for the license id "".
      for (const reference_id of ['', '   ', 42, null, {}]) {
        expect(parseOrderPaid(evt({ metadata: { reference_id } }))?.referenceId).toBeUndefined();
      }
    });
  });

  it('returns null for non-order.paid', () => {
    expect(parseOrderPaid(JSON.stringify({ type: 'order.refunded' }))).toBeNull();
  });
});
