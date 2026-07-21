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
  it('extracts order id, email, name, paid date', () => {
    const body = JSON.stringify({
      type: 'order.paid',
      data: { id: 'ord_123', created_at: '2026-07-20T10:00:00Z',
              customer: { email: 'buyer@example.com', name: 'Buy Er' } },
    });
    expect(parseOrderPaid(body)).toEqual({
      orderId: 'ord_123', email: 'buyer@example.com', name: 'Buy Er', paidAtISO: '2026-07-20T10:00:00Z',
    });
  });
  it('returns null for non-order.paid', () => {
    expect(parseOrderPaid(JSON.stringify({ type: 'order.refunded' }))).toBeNull();
  });
});
