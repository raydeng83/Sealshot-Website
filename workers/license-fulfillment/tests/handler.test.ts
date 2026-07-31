import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToBase64, utf8ToBytes } from '../src/base64';

/** KV fake with the metadata + list support `listPending` relies on. */
function fakeKV() {
  const values = new Map<string, string>();
  const metas = new Map<string, unknown>();
  return {
    get: async (k: string) => values.get(k) ?? null,
    put: async (k: string, v: string, opts?: { metadata?: unknown }) => {
      values.set(k, v);
      if (opts?.metadata !== undefined) metas.set(k, opts.metadata);
    },
    list: async (opts?: { prefix?: string }) => ({
      keys: [...values.keys()]
        .filter((name) => name.startsWith(opts?.prefix ?? ''))
        .map((name) => ({ name, metadata: metas.get(name) })),
      list_complete: true,
      cursor: undefined,
    }),
  } as unknown as KVNamespace;
}

/** Collects `waitUntil` work so a test can await background delivery. */
function fakeCtx() {
  const tasks: Promise<unknown>[] = [];
  return {
    ctx: { waitUntil: (p: Promise<unknown>) => void tasks.push(p) } as unknown as ExecutionContext,
    settle: () => Promise.all(tasks),
  };
}

const SECRET_RAW = 'unit_test_secret_key_padding____';
const SECRET_B64 = btoa(SECRET_RAW);

async function signedRequest(body: string, secretB64: string, ts = String(Math.floor(Date.now() / 1000))) {
  const id = 'msg_1';
  const key = await crypto.subtle.importKey('raw', utf8ToBytes(atob(secretB64)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return new Request('https://w/webhooks/polar', {
    method: 'POST', body,
    headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${bytesToBase64(new Uint8Array(mac))}` },
  });
}

function makeEnv(fetchImpl: typeof fetch, extra: Record<string, unknown> = {}) {
  const priv = ed25519.utils.randomPrivateKey();
  return {
    env: {
      ORDERS: fakeKV(),
      SIGNING_KEY_B64: bytesToBase64(priv),
      POLAR_WEBHOOK_SECRET: `whsec_${SECRET_B64}`,
      RESEND_API_KEY: 'rk',
      EMAIL_FROM: 'Sealshot <license@mail.seal-shot.com>',
      REPLY_TO: 'support@seal-shot.com',
      FETCH: fetchImpl,
      ...extra,
    },
  };
}

const ORDER = JSON.stringify({
  type: 'order.paid',
  data: { id: 'ord_1', created_at: '2026-07-20T10:00:00Z', customer: { email: 'buyer@example.com', name: 'Buy Er' } },
});

const readRec = async (env: { ORDERS: KVNamespace }, id = 'ord_1') =>
  JSON.parse((await env.ORDERS.get(`order:${id}`))!);

describe('worker handler', () => {
  it('issues + emails on a valid order.paid, returns 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect((await readRec(env)).state).toBe('sent');
  });

  it('acknowledges before delivering, then delivers in the background', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const { ctx, settle } = fakeCtx();

    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env, ctx);
    // 200 comes back with the send still outstanding — the order is recorded,
    // so finishing delivery is our job, not Polar's.
    expect(res.status).toBe(200);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect((await readRec(env)).state).toBe('pending');

    await settle();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect((await readRec(env)).state).toBe('sent');
  });

  it('sets reply_to so buyer replies reach a real inbox', async () => {
    let sentBody = '';
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      sentBody = init.body as string;
      return new Response('{}', { status: 200 });
    });
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(JSON.parse(sentBody).reply_to).toBe('support@seal-shot.com');
  });

  it('is idempotent: second delivery skips re-issue and re-email, still 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    expect((await worker.fetch(await signedRequest(ORDER, SECRET_B64), env)).status).toBe(200);
    const firstLicenseId = (await readRec(env)).licenseId;

    expect((await worker.fetch(await signedRequest(ORDER, SECRET_B64), env)).status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const rec2 = await readRec(env);
    expect(rec2.state).toBe('sent');
    expect(rec2.licenseId).toBe(firstLicenseId);
  });

  it('keeps the order pending and still returns 200 when the email fails', async () => {
    // 200 is deliberate: the order is recorded, so retrying is ours (the cron),
    // not Polar's. Returning 500 here would risk Polar disabling the endpoint.
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(200);
    const rec = await readRec(env);
    expect(rec.state).toBe('pending');
    expect(rec.attempts).toBe(1);
    expect(rec.lastError).toContain('500');
  });

  it('returns 500 only when the order could not be recorded at all', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    env.ORDERS.put = (async () => {
      throw new Error('kv down');
    }) as unknown as KVNamespace['put'];

    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(500); // nothing kept, so Polar should redeliver
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a genuinely stale timestamp with 400', async () => {
    // The window is a day: idempotency is the real replay defence, and a tight
    // window would reject legitimate redeliveries whose backoff outlasts it.
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const staleTs = String(Math.floor(Date.now() / 1000) - 48 * 3600);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64, staleTs), env);
    expect(res.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts a redelivery whose timestamp is hours old', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const olderTs = String(Math.floor(Date.now() / 1000) - 4 * 3600);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64, olderTs), env);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('returns 404 for anything other than POST /webhooks/polar, never calling fetch', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);

    expect((await worker.fetch(new Request('https://w/webhooks/polar', { method: 'GET' }), env)).status).toBe(404);
    expect((await worker.fetch(new Request('https://w/something-else', { method: 'POST', body: ORDER }), env)).status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns 200 with no side effects for a signed, non-order.paid event', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const body = JSON.stringify({
      type: 'checkout.created',
      data: { id: 'ord_2', created_at: '2026-07-20T10:00:00Z', customer: { email: 'buyer@example.com', name: 'Buy Er' } },
    });
    expect((await worker.fetch(await signedRequest(body, SECRET_B64), env)).status).toBe(200);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await env.ORDERS.get('order:ord_2')).toBeNull();
  });

  it('rejects a bad signature with 401', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, btoa('the_wrong_secret_key_padding___')), env);
    expect(res.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects unsafe (bidi-override) buyer name without issuing or emailing, returns 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const body = JSON.stringify({
      type: 'order.paid',
      data: { id: 'ord_3', created_at: '2026-07-20T10:00:00Z', customer: { email: 'buyer@example.com', name: 'Buy‮Er' } },
    });
    expect((await worker.fetch(await signedRequest(body, SECRET_B64), env)).status).toBe(200);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect((await readRec(env, 'ord_3')).state).toBe('rejected');
  });
});

describe('scheduled retry', () => {
  it('delivers an order the webhook left pending, and reuses its license id', async () => {
    let failing = true;
    const fetchImpl = vi.fn(async () =>
      failing ? new Response('nope', { status: 500 }) : new Response('{}', { status: 200 })
    );
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);

    await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    const pendingRec = await readRec(env);
    expect(pendingRec.state).toBe('pending');

    // Let the 5-minute backoff elapse (the webhook attempt was just now).
    await env.ORDERS.put(
      'order:ord_1',
      JSON.stringify({ ...pendingRec, lastAttemptAt: new Date(Date.now() - 10 * 60_000).toISOString() }),
      { metadata: { state: 'pending' } }
    );

    // Resend recovers; the next cron tick should finish the job.
    failing = false;
    await worker.scheduled({} as ScheduledEvent, env);

    const sentRec = await readRec(env);
    expect(sentRec.state).toBe('sent');
    expect(sentRec.licenseId).toBe(pendingRec.licenseId); // same licence, not a new one
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('leaves settled orders alone', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect((await readRec(env)).state).toBe('sent');

    await worker.scheduled({} as ScheduledEvent, env);
    expect(fetchImpl).toHaveBeenCalledOnce(); // no re-send
  });

  it('respects backoff: a just-attempted order is not retried immediately', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(fetchImpl).toHaveBeenCalledOnce();

    await worker.scheduled({} as ScheduledEvent, env);
    expect(fetchImpl).toHaveBeenCalledOnce(); // still inside the 5-minute wait
  });
});
