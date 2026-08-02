import { describe, it, expect } from 'vitest';
import { fakeKV } from './fake-kv';
import { putLicense } from '../src/store';
import { resolveRenewalTarget } from '../src/renewal';

describe('resolveRenewalTarget', () => {
  async function seeded() {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-1', {
      name: 'Jane', email: 'jane@example.com', licenseType: 'individual',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1, latestOrderId: 'o1',
    });
    return kv;
  }

  it('prefers the reference id', async () => {
    const t = await resolveRenewalTarget(await seeded(), {
      referenceId: 'LIC-1', email: 'other@x.com',
    });
    expect(t?.licenseId).toBe('LIC-1');
    expect(t?.source).toBe('reference');
  });

  it('falls back to the buyer email', async () => {
    const t = await resolveRenewalTarget(await seeded(), {
      referenceId: undefined, email: 'jane@example.com',
    });
    expect(t?.licenseId).toBe('LIC-1');
    expect(t?.source).toBe('email');
  });

  it('falls back to email when the reference id is unknown', async () => {
    // The chain is never a conjunction — a reference id that has gone stale
    // must not block a buyer whose email still resolves.
    const t = await resolveRenewalTarget(await seeded(), {
      referenceId: 'GHOST', email: 'jane@example.com',
    });
    expect(t?.licenseId).toBe('LIC-1');
    expect(t?.source).toBe('email');
  });

  it('returns null when neither matches', async () => {
    expect(
      await resolveRenewalTarget(await seeded(), { referenceId: 'GHOST', email: 'nobody@x.com' })
    ).toBeNull();
  });

  it('reports a disagreement so the caller can alert, honouring the reference', async () => {
    const kv = await seeded();
    await putLicense(kv, 'LIC-2', {
      name: 'Sam', email: 'sam@example.com', licenseType: 'individual',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1, latestOrderId: 'o2',
    });
    const t = await resolveRenewalTarget(kv, { referenceId: 'LIC-1', email: 'sam@example.com' });
    expect(t?.licenseId).toBe('LIC-1');
    expect(t?.disagreedWithEmail).toBe('LIC-2');
  });

  it('does not report a disagreement when both agree', async () => {
    const t = await resolveRenewalTarget(await seeded(), {
      referenceId: 'LIC-1', email: 'jane@example.com',
    });
    expect(t?.disagreedWithEmail).toBeUndefined();
  });

  it('returns the licence record, not just its id', async () => {
    // The caller needs updatesThrough, seats and licenseType to build the
    // renewal; re-reading them separately would risk a different snapshot.
    const t = await resolveRenewalTarget(await seeded(), {
      referenceId: 'LIC-1', email: 'jane@example.com',
    });
    expect(t?.rec).toMatchObject({
      updatesThrough: '2027-01-01', seats: 1, licenseType: 'individual', name: 'Jane',
    });
  });

  it('resolves a volume licence too, so the caller can alert on it', async () => {
    const { kv } = fakeKV();
    await putLicense(kv, 'LIC-V', {
      name: 'Acme, Inc.', email: 'software@acme.example', licenseType: 'business-volume',
      issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 25, latestOrderId: 'o9',
    });
    const t = await resolveRenewalTarget(kv, {
      referenceId: 'LIC-V', email: 'software@acme.example',
    });
    expect(t?.rec.licenseType).toBe('business-volume');
    expect(t?.rec.seats).toBe(25);
  });
});
