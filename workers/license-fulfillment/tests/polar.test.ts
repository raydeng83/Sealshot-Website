import { describe, it, expect } from 'vitest';
import { verifyPolarSignature, parseOrderPaid } from '../src/polar';
import { bytesToBase64, utf8ToBytes } from '../src/base64';

async function sign(secretB64: string, id: string, ts: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0)),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return bytesToBase64(new Uint8Array(mac));
}

const SECRET_B64 = btoa('supersecretkey_padded_to_bytes__');

describe('verifyPolarSignature', () => {
  it('accepts a correctly signed body', async () => {
    const body = '{"type":"order.paid"}';
    const id = 'msg_1', ts = '1721470000';
    const sig = await sign(SECRET_B64, id, ts, body);
    const headers = new Headers({
      'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${sig}`,
    });
    expect(await verifyPolarSignature(body, headers, `whsec_${SECRET_B64}`)).toBe(true);
  });
  it('rejects a tampered body', async () => {
    const id = 'msg_1', ts = '1721470000';
    const sig = await sign(SECRET_B64, id, ts, '{"type":"order.paid"}');
    const headers = new Headers({
      'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${sig}`,
    });
    expect(await verifyPolarSignature('{"type":"evil"}', headers, `whsec_${SECRET_B64}`)).toBe(false);
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
    // A buyer who paid must still get a licence; PRODUCT_MAP's default covers it.
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
      // lookup for the licence id "".
      for (const reference_id of ['', '   ', 42, null, {}]) {
        expect(parseOrderPaid(evt({ metadata: { reference_id } }))?.referenceId).toBeUndefined();
      }
    });
  });

  it('returns null for non-order.paid', () => {
    expect(parseOrderPaid(JSON.stringify({ type: 'order.refunded' }))).toBeNull();
  });
});
