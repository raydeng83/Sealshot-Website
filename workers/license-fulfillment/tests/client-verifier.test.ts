/**
 * The BROWSER verifier (src/lib/license-client.ts, used by /renew) tested
 * against the Worker's issuer.
 *
 * It lives in the Worker's suite rather than the site's because it imports both
 * halves, and only this package's tsconfig has the Cloudflare/Node lib types
 * that the Worker's own sources need. Running it from the site would drag those
 * files into the site's typecheck and fail there.
 *
 * This is the pairing that matters: the thing that mints licenses and the thing
 * the renewal page reads them with are separate implementations of the same
 * format, and only an end-to-end test proves they agree.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ed25519 } from '@noble/curves/ed25519';
import {
  verifyLicenseFile, canonicalize, projectedThrough, addMonthsUTC, formatDay,
} from '../../../src/lib/license-client';
// The Worker's issuer, imported directly. This is the point of the suite: the
// thing that mints licenses and the thing the renewal page reads them with are
// separate implementations, and only an end-to-end test proves they agree.
import { issueLicense } from '../src/license';

const priv = ed25519.utils.randomPrivateKey();
const bytesToB64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
// Key id 1 signed with a throwaway key, so no real, usable license has to be
// committed to the repo to exercise the happy path.
const TEST_KEYS = { 1: bytesToB64(ed25519.getPublicKey(priv)) };

const INPUT = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  issued: '2026-07-20',
  updatesThrough: '2027-07-20',
  seats: 1,
  id: '550E8400-E29B-41D4-A716-446655440000',
  licenseType: 'individual',
} as const;

const licenseFile = () => issueLicense({ ...INPUT }, priv);

describe('verifyLicenseFile', () => {
  it('accepts a license the Worker issued, and reads its payload', async () => {
    const res = await verifyLicenseFile(await licenseFile(), TEST_KEYS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.payload).toMatchObject({
      id: INPUT.id, name: 'Jane Doe', email: 'jane@example.com',
      licenseType: 'individual', updatesThrough: '2027-07-20', seats: 1,
    });
  });

  it('accepts a volume license and reports its type and seats', async () => {
    // The page refuses these, so it has to be able to read them.
    const file = await issueLicense(
      { ...INPUT, name: 'Acme, Inc.', seats: 25, licenseType: 'business-volume' }, priv);
    const res = await verifyLicenseFile(file, TEST_KEYS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.payload.licenseType).toBe('business-volume');
    expect(res.payload.seats).toBe(25);
  });

  it('survives CRLF line endings and a BOM', async () => {
    // A license that has been through Windows, or opened and re-saved by a
    // well-meaning editor, must still verify — that is what canonicalize is for.
    const mangled = '﻿' + (await licenseFile()).replace(/\n/g, '\r\n');
    expect((await verifyLicenseFile(mangled, TEST_KEYS)).ok).toBe(true);
  });

  it('survives trailing whitespace on preamble lines', async () => {
    const padded = (await licenseFile())
      .split('\n')
      .map((l) => (l.startsWith('SEALSHOT1.') ? l : l + '   '))
      .join('\n');
    expect((await verifyLicenseFile(padded, TEST_KEYS)).ok).toBe(true);
  });

  describe('rejections', () => {
    it('reports notALicense for an unrelated file', async () => {
      const res = await verifyLicenseFile('just some notes\n', TEST_KEYS);
      expect(res).toEqual({ ok: false, reason: 'notALicense' });
    });

    it('reports malformed for an unreadable envelope', async () => {
      const res = await verifyLicenseFile('Sealshot License\n\nSEALSHOT1.@@@@\n', TEST_KEYS);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.reason).toBe('malformed');
    });

    it('reports unknownKey when signed by a key this page does not have', async () => {
      const res = await verifyLicenseFile(await licenseFile(), { 7: TEST_KEYS[1] });
      expect(res).toEqual({ ok: false, reason: 'unknownKey' });
    });

    it('reports badSignature when signed by the wrong key', async () => {
      const other = bytesToB64(ed25519.getPublicKey(ed25519.utils.randomPrivateKey()));
      const res = await verifyLicenseFile(await licenseFile(), { 1: other });
      expect(res).toEqual({ ok: false, reason: 'badSignature' });
    });

    it('reports textTampered when the readable preamble is edited', async () => {
      // The whole point of textHash: the signature still verifies, because the
      // payload bytes are untouched — only the hash catches this.
      const edited = (await licenseFile()).replace('Updates through:  2027-07-20',
                                                   'Updates through:  2099-07-20');
      const res = await verifyLicenseFile(edited, TEST_KEYS);
      expect(res).toEqual({ ok: false, reason: 'textTampered' });
    });

    it('reports textTampered when the licensee name is edited', async () => {
      const edited = (await licenseFile()).replace('Jane Doe', 'Someone Else');
      expect((await verifyLicenseFile(edited, TEST_KEYS)).ok).toBe(false);
    });
  });
});

describe('canonicalize', () => {
  it('matches the shared golden preamble byte for byte', () => {
    // Same fixture the app's Swift suite and the Worker assert against. If this
    // port drifts, every genuine license would be reported as textTampered.
    const fixture = readFileSync(
      join(__dirname, 'fixtures', 'golden-preamble-v2.txt'), 'utf8').replace(/\n+$/, '');
    expect(canonicalize(fixture)).toBe(fixture);
  });

  it('does not strip U+FEFF from mid-text, only a leading BOM', () => {
    // U+FEFF is deliberately NOT in the whitespace set — Swift agrees, JS's \s
    // does not, and following \s here would change the hash.
    expect(canonicalize('a﻿')).toBe('a﻿');
    expect(canonicalize('﻿a')).toBe('a');
  });
});

describe('projectedThrough', () => {
  it('keeps unused time when renewing early', () => {
    expect(projectedThrough('2027-09-15', '2027-08-01')).toBe('2028-09-15');
  });
  it('starts from today once the window has lapsed', () => {
    expect(projectedThrough('2027-09-15', '2028-03-01')).toBe('2029-03-01');
  });
  it('agrees with addMonthsUTC on the boundary day', () => {
    expect(projectedThrough('2027-09-15', '2027-09-15')).toBe(addMonthsUTC('2027-09-15', 12));
  });
});

describe('formatDay', () => {
  it('formats in UTC, so a late-evening local time cannot shift the day', () => {
    expect(formatDay('2027-07-20')).toBe('20 July 2027');
  });
  it('passes through anything unparseable rather than showing "Invalid Date"', () => {
    expect(formatDay('not-a-date')).toBe('not-a-date');
  });
});
