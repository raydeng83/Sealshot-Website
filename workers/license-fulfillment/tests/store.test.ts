import { describe, it, expect } from 'vitest';
import { fakeKV } from './fake-kv';
import {
  getOrder,
  putOrder,
  getLicense,
  putLicense,
  findLicenseIdByEmail,
  type OrderRecord,
  type LicenseRecord,
} from '../src/store';

describe('store', () => {
  it('round-trips an order record', async () => {
    const { kv } = fakeKV();
    const rec: OrderRecord = {
      licenseId: 'lic1', email: 'a@b.com', name: 'A B', issued: '2026-07-20',
      state: 'sent', attempts: 1, firstSeenAt: '2026-07-20T10:00:00.000Z',
    };
    expect(await getOrder(kv, 'ord_1')).toBeNull();
    await putOrder(kv, 'ord_1', rec);
    expect(await getOrder(kv, 'ord_1')).toEqual(rec);
  });

  it('mirrors state into KV metadata so listPending can skip settled orders', async () => {
    const { kv, metas } = fakeKV();
    await putOrder(kv, 'ord_1', {
      licenseId: 'lic1', email: 'a@b.com', name: 'A B', issued: '2026-07-20',
      state: 'pending', attempts: 0, firstSeenAt: '2026-07-20T10:00:00.000Z',
    });
    expect(metas.get('order:ord_1')).toEqual({ state: 'pending' });
  });
});

describe('licence records', () => {
  const rec: LicenseRecord = {
    name: 'Jane Doe', email: 'Jane@Example.com', licenseType: 'individual',
    issued: '2026-07-20', updatesThrough: '2027-07-20', seats: 1,
    latestOrderId: 'ord_1',
  };

  it('round-trips a licence record', async () => {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-1', rec);
    expect(await getLicense(kv, 'LIC-1')).toEqual(rec);
  });

  it('indexes by lowercased email', async () => {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-1', rec);
    expect(await findLicenseIdByEmail(kv, 'jane@example.com')).toBe('LIC-1');
    expect(await findLicenseIdByEmail(kv, 'JANE@EXAMPLE.COM')).toBe('LIC-1');
  });

  it('tolerates surrounding whitespace on lookup', async () => {
    // Buyers paste addresses into the renewal form; a trailing space must not
    // read as a different customer.
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-1', rec);
    expect(await findLicenseIdByEmail(kv, '  jane@example.com ')).toBe('LIC-1');
  });

  it('returns null for an unknown licence or email', async () => {
    const { kv } = fakeKV();
    expect(await getLicense(kv, 'nope')).toBeNull();
    expect(await findLicenseIdByEmail(kv, 'nobody@example.com')).toBeNull();
  });

  it('keeps the old email pointing at the licence when the address changes', async () => {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-1', rec);
    await putLicense(kv, 'LIC-1', { ...rec, email: 'new@example.com' });
    expect(await findLicenseIdByEmail(kv, 'new@example.com')).toBe('LIC-1');
    expect(await findLicenseIdByEmail(kv, 'jane@example.com')).toBe('LIC-1');
  });

  it('keeps order records and licence records in separate keyspaces', async () => {
    // Both are addressed by opaque ids. If the prefixes ever collided, an
    // order id equal to a licence id would overwrite a customer's licence.
    const { kv, values } = fakeKV();
    await putOrder(kv, 'SAME', {
      licenseId: 'SAME', email: 'a@b.com', name: 'A B', issued: '2026-07-20',
      state: 'sent', attempts: 1, firstSeenAt: '2026-07-20T10:00:00.000Z',
    });
    await putLicense(kv, 'SAME', rec);
    expect(await getOrder(kv, 'SAME')).not.toBeNull();
    expect(await getLicense(kv, 'SAME')).toEqual(rec);
    expect([...values.keys()].sort()).toEqual([
      'email:jane@example.com', 'license:SAME', 'order:SAME',
    ]);
  });
});
