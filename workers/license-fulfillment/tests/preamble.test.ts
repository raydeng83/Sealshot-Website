import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPreamble } from '../src/canonical';

/**
 * Preamble v2 byte parity.
 *
 * The SHA-256 of the canonicalized preamble is embedded in the signed payload,
 * so any drift between this Worker, the app, and licensegen makes issued
 * licences fail the app's tamper check as `textTampered` — the customer pays
 * and cannot activate. Three implementations, one set of bytes.
 *
 * Two layers on purpose, mirroring the app's LicenseFormatTests:
 *  - the inline expectations catch a bad edit to src/canonical.ts;
 *  - the fixture assertions catch the three implementations diverging from
 *    each other, because the fixture file is shared, not per-implementation.
 *
 * Authority: app/Sources/Sealshot/Licensing/LicenseFormat.swift → buildPreamble.
 */

/** Fixtures carry a trailing newline; buildPreamble returns none. */
function fixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8').replace(/\n+$/, '');
}

const INDIVIDUAL = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  id: '550E8400-E29B-41D4-A716-446655440000',
  issued: '2026-07-20',
  updatesThrough: '2027-07-20',
  seats: 1,
  licenseType: 'individual',
} as const;

const VOLUME = {
  name: 'Acme, Inc.',
  email: 'software@acme.example',
  id: '946C87B1-C2D7-46E9-B8CF-D88EB86532EE',
  issued: '2027-08-01',
  updatesThrough: '2028-09-15',
  seats: 10,
  licenseType: 'business-volume',
} as const;

describe('buildPreamble', () => {
  it('matches the exact Swift template for an individual licence', () => {
    expect(buildPreamble(INDIVIDUAL)).toBe(
      [
        'Sealshot License',
        '================',
        'Licensed to:      Jane Doe',
        'Email:            jane@example.com',
        'License ID:       550E8400-E29B-41D4-A716-446655440000',
        'License type:     Individual',
        'License issued:   2026-07-20',
        'App access:       Perpetual',
        'Updates through:  2027-07-20',
        'Users:            1',
        'Macs per user:    2',
        '',
        'This license does not expire. It permits use of every Sealshot',
        'release whose entitlement date is on or before 2027-07-20.',
        '',
        'Keep this file exactly as received. The information above is',
        'cryptographically signed; modifying it invalidates the license.',
      ].join('\n')
    );
  });

  it('matches the exact Swift template for a business volume licence', () => {
    expect(buildPreamble(VOLUME)).toBe(
      [
        'Sealshot License',
        '================',
        'Licensed to:      Acme, Inc.',
        'Purchaser email:  software@acme.example',
        'License ID:       946C87B1-C2D7-46E9-B8CF-D88EB86532EE',
        'License type:     Business Volume',
        'License issued:   2027-08-01',
        'App access:       Perpetual',
        'Updates through:  2028-09-15',
        'User seats:       10',
        'Macs per user:    2',
        '',
        'This is an offline, organization-wide license for up to 10 users.',
        'Sealshot does not transmit installation or usage information.',
      ].join('\n')
    );
  });

  it('reproduces the shared golden fixture for an individual licence', () => {
    // fixtures/golden-preamble-v2.txt is a verbatim copy of
    // app/Tests/SealshotTests/Fixtures/golden-preamble-v2.txt. If this fails,
    // the Worker template drifted from the app's, and both copies plus
    // licensegen must be fixed in the same change.
    expect(buildPreamble(INDIVIDUAL)).toBe(fixture('golden-preamble-v2.txt'));
  });

  it('reproduces the shared golden fixture for a business volume licence', () => {
    // The app repo has no volume fixture yet — this file is the canonical
    // bytes and should be adopted there as golden-preamble-v2-volume.txt.
    // Until it is, the volume template is pinned on this side only, so an
    // edit to the Swift copy alone would still pass the app's suite.
    expect(buildPreamble(VOLUME)).toBe(fixture('golden-preamble-v2-volume.txt'));
  });

  it('pads every label to 18 columns', () => {
    // v1 used 17. Catches a half-applied width change, which would otherwise
    // only surface on whichever labels a fixture happened to exercise.
    for (const licenseType of ['individual', 'business-volume'] as const) {
      const out = buildPreamble({ ...INDIVIDUAL, licenseType });
      for (const line of out.split('\n')) {
        const colon = line.indexOf(':');
        if (colon === -1 || line.startsWith('=')) continue;
        const label = line.slice(0, colon + 1);
        if (label.length >= 18) continue; // long labels push the value right
        expect(line.slice(0, 18).trimEnd()).toBe(label);
      }
    }
  });

  it('omits the "keep this file" paragraph only for volume licences', () => {
    // Asymmetry from the source document, not an oversight — pinned so a
    // later "consistency" tidy-up can't silently change signed bytes.
    expect(buildPreamble(INDIVIDUAL)).toContain('Keep this file exactly as received');
    expect(buildPreamble(VOLUME)).not.toContain('Keep this file exactly as received');
  });
});
