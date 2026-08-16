import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToBase64, utf8ToBytes } from '../src/base64';
import { fakeKV } from './fake-kv';
import { getLicense, putLicense, getOrder, putOrder } from '../src/store';
import { parseOrderRefunded } from '../src/polar';
import { resolveRenewalTarget } from '../src/renewal';

/**
 * order.refunded handling.
 *
 * Until this existed a refund was invisible: the order kept its `sent` state,
 * the licence record stayed valid, and the email index still resolved to it — so
 * a refunded customer could buy a renewal and have a revoked licence
 * quietly reinstated with a fresh window.
 */

const SECRET = 'whsec_unit_test_secret_value';
const PROD_RENEWAL = 'prod_renewal';
const PRODUCT_MAP = JSON.stringify({
  prod_new: { kind: 'new', months: 12 },
  [PROD_RENEWAL]: { kind: 'renewal', months: 12 },
});

function fakeCtx() {
  const tasks: Promise<unknown>[] = [];
  return {
    ctx: { waitUntil: (p: Promise<unknown>) => void tasks.push(p) } as unknown as ExecutionContext,
    settle: () => Promise.all(tasks),
  };
}

async function signed(body: string, id = 'msg_1') {
  const ts = String(Math.floor(Date.now() / 1000));
  const key = await crypto.subtle.importKey(
    'raw', utf8ToBytes(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return new Request('https://w/webhooks/polar', {
    method: 'POST', body,
    headers: {
      'webhook-id': id, 'webhook-timestamp': ts,
      'webhook-signature': `v1,${bytesToBase64(new Uint8Array(mac))}`,
    },
  });
}

const refundEvent = (orderId: string) =>
  JSON.stringify({ type: 'order.refunded', data: { id: orderId } });

const renewalEvent = (orderId: string, referenceId: string) =>
  JSON.stringify({
    type: 'order.paid',
    data: {
      id: orderId, created_at: '2027-06-01T00:00:00Z', product_id: PROD_RENEWAL,
      customer: { email: 'jane@example.com', name: 'Jane Doe' },
      metadata: { reference_id: referenceId },
    },
  });

function makeEnv() {
  const { kv } = fakeKV();
  const sent: string[] = [];
  return {
    env: {
      ORDERS: kv,
      SIGNING_KEY_B64: bytesToBase64(ed25519.utils.randomPrivateKey()),
      POLAR_WEBHOOK_SECRET: SECRET,
      RESEND_API_KEY: 'rk',
      EMAIL_FROM: 'Sealshot <license@mail.seal-shot.com>',
      PRODUCT_MAP,
      FETCH: vi.fn(async (_u: unknown, init?: RequestInit) => {
        const b = JSON.parse(String(init?.body ?? '{}'));
        if (b.attachments?.[0]) sent.push(atob(b.attachments[0].content));
        return new Response('{}', { status: 200 });
      }) as unknown as typeof fetch,
    } as any,
    sent,
  };
}

async function post(env: any, body: string, msgId = 'msg_1') {
  const { ctx, settle } = fakeCtx();
  const res = await worker.fetch(await signed(body, msgId), env, ctx);
  await settle();
  return res;
}

/** A delivered order plus its licence, as fulfilment would have left them. */
async function seedDelivered(env: any) {
  await putOrder(env.ORDERS, 'ord_1', {
    licenseId: 'LIC-1', email: 'jane@example.com', name: 'Jane Doe',
    issued: '2026-08-02', updatesThrough: '2027-08-02',
    licenseType: 'individual', seats: 1,
    state: 'sent', attempts: 1, firstSeenAt: '2026-08-02T00:00:00.000Z',
  });
  await putLicense(env.ORDERS, 'LIC-1', {
    name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
    issued: '2026-08-02', updatesThrough: '2027-08-02', seats: 1,
    latestOrderId: 'ord_1',
  });
}

describe('parseOrderRefunded', () => {
  it('reads the order id', () => {
    expect(parseOrderRefunded(refundEvent('ord_9'))).toEqual({ orderId: 'ord_9' });
  });
  it('ignores order.paid', () => {
    expect(parseOrderRefunded(renewalEvent('ord_1', 'LIC-1'))).toBeNull();
  });
  it('ignores an event with no order id', () => {
    expect(parseOrderRefunded('{"type":"order.refunded","data":{}}')).toBeNull();
  });
});

describe('order.refunded', () => {
  it('marks the order refunded and flags the licence', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await seedDelivered(env);

    const res = await post(env, refundEvent('ord_1'));
    expect(res.status).toBe(200);

    expect((await getOrder(env.ORDERS, 'ord_1'))!.state).toBe('refunded');
    expect((await getLicense(env.ORDERS, 'LIC-1'))!.refunded).toBe(true);
    err.mockRestore();
  });

  it('alerts with the exact revoke command, because revocation is manual', async () => {
    // The Worker cannot commit to the release repo, so the alert has to carry
    // everything needed to finish the job by hand.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await seedDelivered(env);
    await post(env, refundEvent('ord_1'));

    const log = err.mock.calls.flat().join('\n');
    expect(log).toContain('licensegen revoke --id LIC-1');
    expect(log).toContain('REVOCATION IS STILL MANUAL');
    expect(log).toContain('jane@example.com');
    err.mockRestore();
  });

  it('is idempotent — a redelivered refund does not alert twice', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await seedDelivered(env);

    await post(env, refundEvent('ord_1'), 'msg_1');
    const after1 = err.mock.calls.length;
    await post(env, refundEvent('ord_1'), 'msg_2');
    expect(err.mock.calls.length).toBe(after1);
    err.mockRestore();
  });

  it('alerts on a refund for an order it never recorded', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await post(env, refundEvent('ord_ghost'));
    expect(err.mock.calls.flat().join('\n')).toContain('refund for an unknown order');
    err.mockRestore();
  });

  it('tolerates an order refunded before a licence id was assigned', async () => {
    // The `rejected` path stores an empty licenseId; a refund must not throw.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await putOrder(env.ORDERS, 'ord_2', {
      licenseId: '', email: 'x@y.com', name: 'X', issued: '2026-08-02',
      updatesThrough: '', licenseType: 'individual', seats: 1,
      state: 'rejected', attempts: 0, firstSeenAt: '2026-08-02T00:00:00.000Z',
    });
    const res = await post(env, refundEvent('ord_2'));
    expect(res.status).toBe(200);
    expect((await getOrder(env.ORDERS, 'ord_2'))!.state).toBe('refunded');
    err.mockRestore();
  });
});

describe('a refunded licence cannot be reinstated by renewing', () => {
  it('resolveRenewalTarget treats it as absent, by reference id and by email', async () => {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-1', {
      name: 'Jane', email: 'jane@example.com', licenseType: 'individual',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1,
      latestOrderId: 'o1', refunded: true,
    });
    expect(await resolveRenewalTarget(kv, {
      referenceId: 'LIC-1', email: 'jane@example.com',
    })).toBeNull();
  });

  it('a renewal of a refunded licence mints a NEW licence and alerts', async () => {
    // They paid for a renewal, so they get something — but the revoked licence is not
    // quietly given a fresh window, and a human is told.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await seedDelivered(env);
    await post(env, refundEvent('ord_1'), 'msg_1');
    err.mockClear();

    await post(env, renewalEvent('ord_2', 'LIC-1'), 'msg_2');

    const renewal = (await getOrder(env.ORDERS, 'ord_2'))!;
    expect(renewal.licenseId).not.toBe('LIC-1');
    expect(renewal.updatesThrough).toBe('2028-06-01');   // 12 months from purchase
    expect(err.mock.calls.flat().join('\n')).toContain('unmatched renewal');

    // And the refunded licence is untouched.
    expect((await getLicense(env.ORDERS, 'LIC-1'))!.updatesThrough).toBe('2027-08-02');
    err.mockRestore();
  });
});
