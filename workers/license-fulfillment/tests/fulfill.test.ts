import { describe, it, expect, vi } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToBase64 } from '../src/base64';
import { getOrder, putOrder, listPending, type OrderRecord } from '../src/store';
import {
  deliverLicense,
  isDue,
  nextDelayMinutes,
  ALERT_AFTER_MINUTES,
  GIVE_UP_AFTER_HOURS,
} from '../src/fulfill';

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
        .filter((n) => n.startsWith(opts?.prefix ?? ''))
        .map((name) => ({ name, metadata: metas.get(name) })),
      list_complete: true,
      cursor: undefined,
    }),
  } as unknown as KVNamespace;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function makeEnv(fetchImpl: typeof fetch, extra: Record<string, unknown> = {}) {
  return {
    ORDERS: fakeKV(),
    SIGNING_KEY_B64: bytesToBase64(ed25519.utils.randomPrivateKey()),
    RESEND_API_KEY: 'rk',
    EMAIL_FROM: 'Sealshot <license@mail.seal-shot.com>',
    REPLY_TO: 'support@seal-shot.com',
    FETCH: fetchImpl,
    ...extra,
  };
}

function pendingRec(over: Partial<OrderRecord> = {}): OrderRecord {
  return {
    licenseId: 'AAAA-BBBB',
    email: 'buyer@example.com',
    name: 'Buy Er',
    issued: '2026-07-20',
    state: 'pending',
    attempts: 0,
    firstSeenAt: new Date(0).toISOString(),
    ...over,
  };
}

describe('backoff', () => {
  it('doubles from 5 minutes and caps at 4 hours', () => {
    expect(nextDelayMinutes(1)).toBe(5);
    expect(nextDelayMinutes(2)).toBe(10);
    expect(nextDelayMinutes(3)).toBe(20);
    expect(nextDelayMinutes(6)).toBe(160);
    expect(nextDelayMinutes(7)).toBe(240);
    expect(nextDelayMinutes(50)).toBe(240); // capped — a stuck order can't
    // burn the KV write budget, since each attempt costs one write
  });

  it('a never-attempted order is due immediately', () => {
    expect(isDue(pendingRec(), Date.now())).toBe(true);
  });

  it('waits out the backoff between attempts', () => {
    const now = 10 * HOUR;
    const rec = pendingRec({ attempts: 2, lastAttemptAt: new Date(now - 9 * MINUTE).toISOString() });
    expect(isDue(rec, now)).toBe(false); // needs 10 minutes
    expect(isDue({ ...rec, lastAttemptAt: new Date(now - 11 * MINUTE).toISOString() }, now)).toBe(true);
  });
});

describe('deliverLicense', () => {
  it('marks the order sent and clears the last error', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const env = makeEnv(fetchImpl as unknown as typeof fetch);
    const rec = pendingRec({ attempts: 1, lastError: 'email HTTP 500' });
    await putOrder(env.ORDERS, 'ord_1', rec);

    expect(await deliverLicense(env, 'ord_1', rec)).toBe(true);
    const stored = await getOrder(env.ORDERS, 'ord_1');
    expect(stored?.state).toBe('sent');
    expect(stored?.attempts).toBe(2);
    expect(stored?.lastError).toBeUndefined();
  });

  it('regenerates the same licence file across attempts', async () => {
    const bodies: string[] = [];
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(init.body as string).attachments[0].content);
      return new Response('nope', { status: 500 });
    });
    const env = makeEnv(fetchImpl as unknown as typeof fetch);
    const rec = pendingRec();
    await putOrder(env.ORDERS, 'ord_1', rec);

    await deliverLicense(env, 'ord_1', rec);
    const afterFirst = (await getOrder(env.ORDERS, 'ord_1'))!;
    await deliverLicense(env, 'ord_1', afterFirst);

    // Same licence id in, byte-identical licence out — a buyer who eventually
    // receives it gets the file we already recorded, not a different one.
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toBe(bodies[1]);
  });

  it('counts the attempt and records why it failed', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 429 }));
    const env = makeEnv(fetchImpl as unknown as typeof fetch);
    const rec = pendingRec({ firstSeenAt: new Date().toISOString() });
    await putOrder(env.ORDERS, 'ord_1', rec);

    expect(await deliverLicense(env, 'ord_1', rec)).toBe(false);
    const stored = (await getOrder(env.ORDERS, 'ord_1'))!;
    expect(stored.state).toBe('pending');
    expect(stored.attempts).toBe(1);
    expect(stored.lastError).toContain('429');
    expect(stored.lastAttemptAt).toBeTruthy();
  });

  it('survives a thrown error rather than rejecting', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const env = makeEnv(fetchImpl as unknown as typeof fetch);
    const rec = pendingRec({ firstSeenAt: new Date().toISOString() });
    await putOrder(env.ORDERS, 'ord_1', rec);

    // Callers run this in the background, where a rejection would be invisible.
    expect(await deliverLicense(env, 'ord_1', rec)).toBe(false);
    expect((await getOrder(env.ORDERS, 'ord_1'))!.lastError).toContain('network down');
  });
});

describe('alerting', () => {
  it('stays quiet on an early failure, then alerts once past the threshold', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('resend') ? new Response('nope', { status: 500 }) : new Response('{}')
    );
    const env = makeEnv(fetchImpl as unknown as typeof fetch, { ALERT_EMAIL: 'ops@example.com' });
    const now = 10 * HOUR;

    // Fresh failure: one send attempt, no alert email.
    const fresh = pendingRec({ firstSeenAt: new Date(now - MINUTE).toISOString() });
    await deliverLicense(env, 'ord_1', fresh, now);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // Stuck past the threshold: the send plus one alert.
    const stuck = pendingRec({
      firstSeenAt: new Date(now - (ALERT_AFTER_MINUTES + 5) * MINUTE).toISOString(),
    });
    await deliverLicense(env, 'ord_2', stuck, now);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const alerted = (await getOrder(env.ORDERS, 'ord_2'))!;
    expect(alerted.alerted).toBe(true);

    // Already alerted: no second alert for the same order.
    await deliverLicense(env, 'ord_2', alerted, now);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('gives up after the cutoff, marks the order failed, and alerts', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('resend') ? new Response('nope', { status: 500 }) : new Response('{}')
    );
    const env = makeEnv(fetchImpl as unknown as typeof fetch, { ALERT_EMAIL: 'ops@example.com' });
    const now = 100 * HOUR;
    const ancient = pendingRec({
      attempts: 12,
      alerted: true, // already alerted earlier — giving up must still alert
      firstSeenAt: new Date(now - (GIVE_UP_AFTER_HOURS + 1) * HOUR).toISOString(),
    });

    await deliverLicense(env, 'ord_9', ancient, now);
    const stored = (await getOrder(env.ORDERS, 'ord_9'))!;
    expect(stored.state).toBe('failed');
    expect(fetchImpl).toHaveBeenCalledTimes(2); // send + give-up alert
  });

  it('works with no ALERT_EMAIL configured (log-only)', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    const env = makeEnv(fetchImpl as unknown as typeof fetch); // no ALERT_EMAIL
    const stuck = pendingRec({ firstSeenAt: new Date(0).toISOString() });
    await deliverLicense(env, 'ord_1', stuck, 100 * HOUR);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // the send only, no alert email
  });
});

describe('listPending', () => {
  it('returns only pending orders and skips settled ones', async () => {
    const kv = fakeKV();
    await putOrder(kv, 'a', pendingRec());
    await putOrder(kv, 'b', pendingRec({ state: 'sent' }));
    await putOrder(kv, 'c', pendingRec({ state: 'rejected' }));
    await putOrder(kv, 'd', pendingRec({ state: 'failed' }));
    await putOrder(kv, 'e', pendingRec());

    const pending = await listPending(kv);
    expect(pending.map((p) => p.orderId).sort()).toEqual(['a', 'e']);
  });

  it('honours the limit so one cron run is bounded', async () => {
    const kv = fakeKV();
    for (let i = 0; i < 10; i++) await putOrder(kv, `ord_${i}`, pendingRec());
    expect(await listPending(kv, 3)).toHaveLength(3);
  });
});
