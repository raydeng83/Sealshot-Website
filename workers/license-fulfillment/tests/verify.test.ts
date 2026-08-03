import { describe, it, expect } from 'vitest';
import { fakeKV } from './fake-kv';
import { putLicense } from '../src/store';
import { handleVerify } from '../src/verify';

const ORIGIN = 'https://seal-shot.com';

const post = (body: unknown, origin = ORIGIN, raw?: string) =>
  new Request('https://w/renew/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: raw ?? JSON.stringify(body),
  });

async function seeded() {
  const { kv } = fakeKV();
  await putLicense(kv, 'LIC-1', {
    name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
    issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1, latestOrderId: 'o1',
  });
  return kv;
}

describe('POST /renew/verify', () => {
  it('returns the license summary and the projected new date for a correct pair', async () => {
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-1' }),
      { ORDERS: await seeded() },
      '2026-08-01'
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
      updatesThrough: '2027-01-01', projectedThrough: '2028-01-01', seats: 1,
    });
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
  });

  it('is case-insensitive on the email', async () => {
    const res = await handleVerify(
      post({ email: 'JANE@EXAMPLE.COM', licenseId: 'LIC-1' }),
      { ORDERS: await seeded() },
      '2026-08-01'
    );
    expect(res.status).toBe(200);
  });

  it('gives an identical 404 for an unknown id and for a mismatched pair', async () => {
    const kv = await seeded();
    const unknown = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'GHOST' }), { ORDERS: kv }, '2026-08-01');
    const mismatch = await handleVerify(
      post({ email: 'someone@else.com', licenseId: 'LIC-1' }), { ORDERS: kv }, '2026-08-01');
    expect(unknown.status).toBe(404);
    expect(mismatch.status).toBe(404);
    expect(await unknown.json()).toEqual(await mismatch.json());
  });

  it('never reveals a license to a caller who only knows the email', async () => {
    // The whole reason the endpoint takes a pair. Knowing jane@example.com
    // owns a license must not be obtainable without the id.
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: '' }), { ORDERS: await seeded() }, '2026-08-01');
    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain('Jane');
  });

  it('rejects a malformed body without touching KV', async () => {
    const res = await handleVerify(
      post({ email: 'jane@example.com' }), { ORDERS: await seeded() }, '2026-08-01');
    expect(res.status).toBe(400);
  });

  it('rejects unparsable JSON', async () => {
    const res = await handleVerify(
      post(null, ORIGIN, '{not json'), { ORDERS: await seeded() }, '2026-08-01');
    expect(res.status).toBe(400);
  });

  it('rejects non-string fields rather than coercing them', async () => {
    // { licenseId: { toString: ... } } must not become a lookup key.
    const res = await handleVerify(
      post({ email: 1, licenseId: ['LIC-1'] }), { ORDERS: await seeded() }, '2026-08-01');
    expect(res.status).toBe(400);
  });

  it('projects from the existing window when renewing early, not from today', async () => {
    // Guards the customer-visible number on the renewal page: it must match
    // what the fulfilment path will actually issue.
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-1' }),
      { ORDERS: await seeded() },
      '2026-08-01' // well inside the 2027-01-01 window
    );
    expect((await res.json() as { projectedThrough: string }).projectedThrough).toBe('2028-01-01');
  });

  it('projects from today once the window has lapsed', async () => {
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-1' }),
      { ORDERS: await seeded() },
      '2027-06-15' // after 2027-01-01
    );
    expect((await res.json() as { projectedThrough: string }).projectedThrough).toBe('2028-06-15');
  });

  it('reports business-volume so the page can refuse it', async () => {
    // /renew must refuse volume licenses: there is no volume checkout product,
    // so renewing one through the individual product would reissue it with the
    // stored seat count at the individual price.
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-V', {
      name: 'Acme, Inc.', email: 'software@acme.example', licenseType: 'business-volume',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 25, latestOrderId: 'o9',
    });
    const res = await handleVerify(
      post({ email: 'software@acme.example', licenseId: 'LIC-V' }), { ORDERS: kv }, '2026-08-01');
    expect(await res.json()).toMatchObject({ licenseType: 'business-volume', seats: 25 });
  });

  describe('CORS', () => {
    it('echoes www as well as the apex', async () => {
      const res = await handleVerify(
        post({ email: 'jane@example.com', licenseId: 'LIC-1' }, 'https://www.seal-shot.com'),
        { ORDERS: await seeded() },
        '2026-08-01'
      );
      expect(res.headers.get('access-control-allow-origin')).toBe('https://www.seal-shot.com');
    });

    it('does not echo an unknown origin', async () => {
      const res = await handleVerify(
        post({ email: 'jane@example.com', licenseId: 'LIC-1' }, 'https://evil.example'),
        { ORDERS: await seeded() },
        '2026-08-01'
      );
      expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    });

    it('sets Vary: Origin so caches cannot share the wrong allow-origin', async () => {
      const res = await handleVerify(
        post({ email: 'jane@example.com', licenseId: 'LIC-1' }),
        { ORDERS: await seeded() },
        '2026-08-01'
      );
      expect(res.headers.get('vary')).toBe('Origin');
    });
  });

  it('returns 429 when the limiter rejects, without reading KV', async () => {
    let reads = 0;
    const kv = {
      get: async () => {
        reads++;
        return null;
      },
    } as unknown as KVNamespace;
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-1' }),
      { ORDERS: kv, VERIFY_LIMITER: { limit: async () => ({ success: false }) } },
      '2026-08-01'
    );
    expect(res.status).toBe(429);
    expect(reads).toBe(0);
  });

  it('works when no limiter is bound, rather than failing closed', async () => {
    // A missing or misconfigured binding must never take the endpoint down.
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-1' }),
      { ORDERS: await seeded() },
      '2026-08-01'
    );
    expect(res.status).toBe(200);
  });
});

describe('a refunded license is not renewable', () => {
  it('returns the identical 404, not a projected date', async () => {
    // resolveRenewalTarget already refuses to extend a refunded license, so a
    // 200 here would have /renew quote a window the purchase will not deliver.
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-R', {
      name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1,
      latestOrderId: 'o1', refunded: true,
    });
    const res = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-R' }), { ORDERS: kv }, '2026-08-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });

  it('is indistinguishable from an unknown id', async () => {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-R', {
      name: 'Jane Doe', email: 'jane@example.com', licenseType: 'individual',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1,
      latestOrderId: 'o1', refunded: true,
    });
    const refunded = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'LIC-R' }), { ORDERS: kv }, '2026-08-01');
    const unknown = await handleVerify(
      post({ email: 'jane@example.com', licenseId: 'NOPE' }), { ORDERS: kv }, '2026-08-01');
    expect(await refunded.json()).toEqual(await unknown.json());
    expect(refunded.status).toBe(unknown.status);
  });
});
