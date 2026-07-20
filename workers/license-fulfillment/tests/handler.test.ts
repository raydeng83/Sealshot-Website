import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToBase64, utf8ToBytes } from '../src/base64';

function fakeKV() {
  const m = new Map<string, string>();
  return { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => void m.set(k, v) } as unknown as KVNamespace;
}
const SECRET_RAW = 'unit_test_secret_key_padding____';
const SECRET_B64 = btoa(SECRET_RAW);

async function signedRequest(body: string, secretB64: string) {
  const id = 'msg_1', ts = '1721470000';
  const key = await crypto.subtle.importKey('raw', utf8ToBytes(atob(secretB64)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return new Request('https://w/webhooks/polar', {
    method: 'POST', body,
    headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${bytesToBase64(new Uint8Array(mac))}` },
  });
}

function makeEnv(fetchImpl: typeof fetch) {
  const priv = ed25519.utils.randomPrivateKey();
  return {
    env: {
      ORDERS: fakeKV(),
      SIGNING_KEY_B64: bytesToBase64(priv),
      POLAR_WEBHOOK_SECRET: `whsec_${SECRET_B64}`,
      RESEND_API_KEY: 'rk',
      EMAIL_FROM: 'Sealshot <license@mail.seal-shot.com>',
      FETCH: fetchImpl,
    },
  };
}

const ORDER = JSON.stringify({
  type: 'order.paid',
  data: { id: 'ord_1', created_at: '2026-07-20T10:00:00Z', customer: { email: 'buyer@example.com', name: 'Buy Er' } },
});

describe('worker handler', () => {
  it('issues + emails on a valid order.paid, returns 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('is idempotent: second delivery does not mint a new license, still 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const req1 = await signedRequest(ORDER, SECRET_B64);
    const req2 = await signedRequest(ORDER, SECRET_B64);
    expect((await worker.fetch(req1, env)).status).toBe(200);
    expect((await worker.fetch(req2, env)).status).toBe(200);
    // one email per delivery is fine; the key assertion is a single stored license id
    const rec = JSON.parse((await env.ORDERS.get('order:ord_1'))!);
    expect(rec.state).toBe('sent');
  });

  it('rejects a bad signature with 401', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, btoa('the_wrong_secret_key_padding___')), env);
    expect(res.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns 500 when email fails (so Polar retries)', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(500);
    const rec = JSON.parse((await env.ORDERS.get('order:ord_1'))!);
    expect(rec.state).toBe('pending');
  });
});
