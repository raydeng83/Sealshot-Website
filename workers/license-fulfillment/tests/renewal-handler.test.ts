import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToBase64, utf8ToBytes } from '../src/base64';
import { fakeKV } from './fake-kv';
import { getLicense, putLicense } from '../src/store';
import { canonicalize } from '../src/canonical';

/**
 * End-to-end renewal behavior through the real webhook handler.
 *
 * The unit suites cover resolveRenewalTarget and renewalThrough in isolation;
 * these check the thing that actually bills a customer — that a renewal order
 * lands on the EXISTING license and moves its window forward exactly once.
 */

// Key is the raw UTF-8 bytes of the whole secret, as Polar signs. See src/polar.ts.
const SECRET = 'whsec_unit_test_secret_value';

const PROD_NEW = 'prod_new';
const PROD_FOUNDING = 'prod_founding';
const PROD_RENEWAL = 'prod_renewal';

const PRODUCT_MAP = JSON.stringify({
  [PROD_NEW]: { kind: 'new', months: 12 },
  [PROD_FOUNDING]: { kind: 'new', months: 18 },
  [PROD_RENEWAL]: { kind: 'renewal', months: 12 },
});

function fakeCtx() {
  const tasks: Promise<unknown>[] = [];
  return {
    ctx: { waitUntil: (p: Promise<unknown>) => void tasks.push(p) } as unknown as ExecutionContext,
    settle: () => Promise.all(tasks),
  };
}

async function signedRequest(body: string, id = 'msg_1') {
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

function order(opts: {
  id?: string; productId: string; email?: string; name?: string;
  referenceId?: string; paidAt?: string; address?: Record<string, string>;
}) {
  return JSON.stringify({
    type: 'order.paid',
    data: {
      id: opts.id ?? 'ord_1',
      created_at: opts.paidAt ?? '2026-07-20T10:00:00Z',
      product_id: opts.productId,
      customer: { email: opts.email ?? 'jane@example.com', name: opts.name ?? 'Jane Doe' },
      ...(opts.address ? { billing_address: opts.address } : {}),
      ...(opts.referenceId ? { metadata: { reference_id: opts.referenceId } } : {}),
    },
  });
}

function makeEnv(extra: Record<string, unknown> = {}) {
  const { kv } = fakeKV();
  const sent: string[] = [];
  const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}'));
    if (body.attachments?.[0]) sent.push(atob(body.attachments[0].content));
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;

  return {
    env: {
      ORDERS: kv,
      SIGNING_KEY_B64: bytesToBase64(ed25519.utils.randomPrivateKey()),
      POLAR_WEBHOOK_SECRET: SECRET,
      RESEND_API_KEY: 'rk',
      EMAIL_FROM: 'Sealshot <license@mail.seal-shot.com>',
      PRODUCT_MAP,
      FETCH: fetchImpl,
      ...extra,
    } as any,
    sent,
  };
}

/** `Updates through:` as it appears in the delivered license file. */
function windowInFile(fileText: string): string {
  return /^Updates through:\s+(\S+)$/m.exec(canonicalize(fileText))![1];
}

async function post(env: any, body: string, msgId = 'msg_1') {
  const { ctx, settle } = fakeCtx();
  const res = await worker.fetch(await signedRequest(body, msgId), env, ctx);
  await settle();
  return res;
}

describe('new purchases', () => {
  it('records a license after delivery, so a later renewal can find it', async () => {
    const { env } = makeEnv();
    await post(env, order({ productId: PROD_NEW }));

    const lic = await getLicense(env.ORDERS, JSON.parse((await env.ORDERS.get('order:ord_1'))!).licenseId);
    expect(lic).toMatchObject({
      name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
      updatesThrough: '2027-07-20', seats: 1, latestOrderId: 'ord_1',
    });
  });

  it('gives the founding product 18 months, not 12', async () => {
    const { env, sent } = makeEnv();
    await post(env, order({ productId: PROD_FOUNDING }));
    expect(windowInFile(sent[0])).toBe('2028-01-20');
  });

  it('states the billing address in the delivered file, and keeps it on the license', async () => {
    const { env, sent } = makeEnv();
    await post(env, order({
      productId: PROD_NEW,
      address: { line1: '1 High St', city: 'Boston', state: 'MA', postal_code: '02110', country: 'US' },
    }));
    expect(sent[0]).toContain('Billing address:  1 High St,');
    expect(sent[0]).toContain('                  Boston, MA 02110, US');
    const rec = JSON.parse((await env.ORDERS.get('order:ord_1'))!);
    expect((await getLicense(env.ORDERS, rec.licenseId))!.address)
      .toEqual(['1 High St,', 'Boston, MA 02110, US']);
  });

  it('omits the field entirely when Polar sends no address', async () => {
    const { env, sent } = makeEnv();
    await post(env, order({ productId: PROD_NEW }));
    expect(sent[0]).not.toContain('Billing address');
  });

  it('does not record a license when delivery fails', async () => {
    // The license record is what the next renewal trusts. Writing it for an
    // undelivered order would advertise a window the customer never received.
    const { env } = makeEnv({
      FETCH: vi.fn(async () => new Response('nope', { status: 500 })) as unknown as typeof fetch,
    });
    await post(env, order({ productId: PROD_NEW }));
    const rec = JSON.parse((await env.ORDERS.get('order:ord_1'))!);
    expect(rec.state).toBe('pending');
    expect(await getLicense(env.ORDERS, rec.licenseId)).toBeNull();
  });
});

describe('renewals', () => {
  async function withLicense(updatesThrough = '2027-07-20', over: Record<string, unknown> = {}) {
    const { env, sent } = makeEnv();
    await putLicense(env.ORDERS, 'LIC-1', {
      name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
      issued: '2026-07-20', updatesThrough, seats: 1, latestOrderId: 'ord_1', ...over,
    } as any);
    return { env, sent };
  }

  it('reuses the license id and extends the window, matched by reference id', async () => {
    const { env, sent } = await withLicense();
    await post(env, order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1', paidAt: '2027-06-01T00:00:00Z',
    }));

    const rec = JSON.parse((await env.ORDERS.get('order:ord_2'))!);
    expect(rec.licenseId).toBe('LIC-1');
    // Renewed early, so the unused month is kept: 2027-07-20 + 12.
    expect(rec.updatesThrough).toBe('2028-07-20');
    expect(windowInFile(sent[0])).toBe('2028-07-20');
    expect((await getLicense(env.ORDERS, 'LIC-1'))!.updatesThrough).toBe('2028-07-20');
  });

  it('matches on buyer email when no reference id came through', async () => {
    const { env } = await withLicense();
    await post(env, order({ id: 'ord_2', productId: PROD_RENEWAL, paidAt: '2027-06-01T00:00:00Z' }));
    expect(JSON.parse((await env.ORDERS.get('order:ord_2'))!).licenseId).toBe('LIC-1');
  });

  it('starts from the purchase day once the window has lapsed', async () => {
    const { env } = await withLicense('2027-07-20');
    await post(env, order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1', paidAt: '2028-03-01T00:00:00Z',
    }));
    expect(JSON.parse((await env.ORDERS.get('order:ord_2'))!).updatesThrough).toBe('2029-03-01');
  });

  it('carries the licensee name from the license, not the Polar customer name', async () => {
    // A renewal bought under a different billing name must not silently rename
    // the license — the name is part of the signed payload.
    const { env, sent } = await withLicense();
    await post(env, order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1',
      name: 'J. Doe-Smith (new card)', paidAt: '2027-06-01T00:00:00Z',
    }));
    expect(sent[0]).toContain('Licensed to:      Jane Doe');
  });

  it('carries the billing address from the license, not the renewing order', async () => {
    // Same reason as the name: a renewal replaces the file, not the owner. A
    // buyer who moved house still holds the license the original states.
    const { env, sent } = await withLicense('2027-07-20', {
      address: ['1 High St,', 'Boston, MA 02110, US'],
    });
    await post(env, order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1',
      paidAt: '2027-06-01T00:00:00Z',
      address: { line1: '9 New Rd', city: 'Cambridge', state: 'MA', country: 'US' },
    }));
    expect(sent[0]).toContain('Billing address:  1 High St,');
    expect(sent[0]).not.toContain('9 New Rd');
  });

  it('gives a pre-address license its address from the renewing order', async () => {
    // Licenses issued before the field exists have none. Taking the renewal's
    // address is how they acquire one, and it cannot overwrite anything.
    const { env, sent } = await withLicense();
    await post(env, order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1',
      paidAt: '2027-06-01T00:00:00Z',
      address: { line1: '9 New Rd', city: 'Cambridge', state: 'MA', country: 'US' },
    }));
    expect(sent[0]).toContain('Billing address:  9 New Rd,');
  });

  it('is idempotent on a plain redelivery of a pending order', async () => {
    const { env } = await withLicense();
    (env as any).FETCH = vi.fn(async () =>
      new Response('nope', { status: 500 })) as unknown as typeof fetch;

    const body = order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1', paidAt: '2027-06-01T00:00:00Z',
    });
    await post(env, body);
    expect(JSON.parse((await env.ORDERS.get('order:ord_2'))!).updatesThrough).toBe('2028-07-20');
    await post(env, body, 'msg_2');
    expect(JSON.parse((await env.ORDERS.get('order:ord_2'))!).updatesThrough).toBe('2028-07-20');
  });

  it('does NOT extend twice when the license was written but the order was not marked sent', async () => {
    // The genuinely dangerous interleaving, and the reason OrderRecord freezes
    // the window. deliverLicense writes the license record BEFORE marking the
    // order sent. If that second write fails, the order stays `pending` while
    // the license already reads 2028-07-20 — so a redelivery that recomputed
    // `renewalThrough(license.updatesThrough, …)` would add another 12 months
    // to the same single purchase and land on 2029-07-20.
    //
    // A plain failed-delivery redelivery cannot catch this: no license is
    // written, so there is nothing extended to re-read.
    const { env } = await withLicense();

    let swallowedSentWrite = false;
    const realPut = env.ORDERS.put.bind(env.ORDERS);
    (env.ORDERS as any).put = async (k: string, v: string, o?: unknown) => {
      if (!swallowedSentWrite && k === 'order:ord_2' && v.includes('"state":"sent"')) {
        swallowedSentWrite = true;
        throw new Error('KV write failed after the license was recorded');
      }
      return realPut(k, v, o as any);
    };

    const body = order({
      id: 'ord_2', productId: PROD_RENEWAL, referenceId: 'LIC-1', paidAt: '2027-06-01T00:00:00Z',
    });
    await post(env, body);

    // The license moved forward, but the order never settled.
    expect(swallowedSentWrite).toBe(true);
    expect((await getLicense(env.ORDERS, 'LIC-1'))!.updatesThrough).toBe('2028-07-20');
    expect(JSON.parse((await env.ORDERS.get('order:ord_2'))!).state).toBe('pending');

    await post(env, body, 'msg_2');

    expect(JSON.parse((await env.ORDERS.get('order:ord_2'))!).updatesThrough).toBe('2028-07-20');
    expect((await getLicense(env.ORDERS, 'LIC-1'))!.updatesThrough).toBe('2028-07-20');
  });

  it('mints a new license and alerts when nothing matches', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = makeEnv();
    await post(env, order({
      id: 'ord_9', productId: PROD_RENEWAL, email: 'stranger@example.com', referenceId: 'GHOST',
    }));

    const rec = JSON.parse((await env.ORDERS.get('order:ord_9'))!);
    expect(rec.licenseId).toBeTruthy();
    expect(rec.updatesThrough).toBe('2027-07-20'); // full window, not empty-handed
    expect(err.mock.calls.flat().join('\n')).toContain('unmatched renewal');
    err.mockRestore();
  });

  it('alerts when a volume license is renewed at the individual price', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env, sent } = await withLicense('2027-07-20', {
      licenseType: 'business-volume', seats: 25, name: 'Acme, Inc.',
    });
    await post(env, order({
      id: 'ord_3', productId: PROD_RENEWAL, referenceId: 'LIC-1', paidAt: '2027-06-01T00:00:00Z',
    }));

    // Honored — they paid — but it must not go unnoticed.
    expect(sent[0]).toContain('License type:     Business Volume');
    expect(sent[0]).toContain('User seats:       25');
    expect(err.mock.calls.flat().join('\n')).toContain('business-volume license renewed');
    err.mockRestore();
  });

  it('alerts when reference id and email point at different licenses', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = await withLicense();
    await putLicense(env.ORDERS, 'LIC-2', {
      name: 'Sam', email: 'sam@example.com', licenseType: 'individual',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1, latestOrderId: 'o2',
    });
    await post(env, order({
      id: 'ord_4', productId: PROD_RENEWAL, referenceId: 'LIC-1', email: 'sam@example.com',
      paidAt: '2027-06-01T00:00:00Z',
    }));

    expect(JSON.parse((await env.ORDERS.get('order:ord_4'))!).licenseId).toBe('LIC-1');
    expect(err.mock.calls.flat().join('\n')).toContain('disagree');
    err.mockRestore();
  });
});

describe('unmapped products', () => {
  it('still delivers, but alerts — the sandbox-ids-in-production case', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env, sent } = makeEnv();
    await post(env, order({ productId: 'prod_from_another_environment' }));

    expect(windowInFile(sent[0])).toBe('2027-07-20'); // default 12 months
    expect(err.mock.calls.flat().join('\n')).toContain('unmapped product');
    err.mockRestore();
  });
});
