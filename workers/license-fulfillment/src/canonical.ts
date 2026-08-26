import { utf8ToBytes, bytesToBase64 } from './base64';

/**
 * Unicode White_Space property code points, mirroring Swift's
 * Character.isWhitespace. This is NOT the same set as JS's `\s`:
 * - U+FEFF (BOM/ZWNBSP) is intentionally excluded — it is not White_Space
 *   in Swift, but JS `\s` incorrectly trims it.
 * - U+0085 (NEL) is intentionally included — it is White_Space in Swift,
 *   but JS `\s` does not match it.
 */
const TRAILING_WHITESPACE = new RegExp(
  '[\\t\\n\\v\\f\\r\\u0020\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+$',
  'u'
);

/** Port of LicenseFileFormat.canonicalize (LicenseFormat.swift:97). */
export function canonicalize(text: string): string {
  let t = text;
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  t = t.normalize('NFC');
  return t
    .split('\n')
    .map((line) => line.replace(TRAILING_WHITESPACE, ''))
    .join('\n');
}

/** base64(SHA256(utf8 bytes of the canonical preamble)). */
export async function textHash(preamble: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', utf8ToBytes(preamble));
  return bytesToBase64(new Uint8Array(digest));
}

/**
 * Wire values, deliberately not the display strings — the preamble renders
 * TYPE_LABEL. Mirrors `LicenseType` (LicenseFormat.swift:21). The app decodes
 * this field as non-optional and *fails* on an unknown value, so emitting a
 * slug the shipped app doesn't know is indistinguishable from a corrupt file.
 */
export type LicenseTypeSlug = 'individual' | 'business-volume';

/** Label column width. Was 17 in preamble v1; v2 widened it for `Updates through:`. */
const LABEL_COLUMN = 18;

/**
 * A template constant, NOT a payload field — the app doesn't sign it.
 *
 * Raised 2 -> 3 on 2026-08-16. It is rendered into the preamble, so it only
 * affects licences issued from here on; already-issued files keep the text
 * they were signed with, and must keep verifying. Must stay in lockstep with
 * LicenseFileFormat.macsPerUser (app) and licensegen's copy, or the three
 * builders produce different bytes and textHash stops matching.
 */
const MACS_PER_USER = 3;

const TYPE_LABEL: Record<LicenseTypeSlug, string> = {
  individual: 'Individual',
  'business-volume': 'Business Volume',
};

/**
 * Port of LicenseFileFormat.buildPreamble (LicenseFormat.swift:163) — preamble v2.
 *
 * Three implementations must produce byte-identical output: this one, the app's
 * Swift original, and licensegen. The SHA-256 of the canonicalized preamble is
 * embedded in the signed payload, so a single byte of drift here makes every
 * license this Worker mints fail the app's tamper check as `textTampered` — the
 * customer pays and cannot activate. `tests/preamble.test.ts` pins the bytes
 * against fixtures shared with the app test suite; do not edit this template
 * without updating all three.
 *
 * Returns no trailing newline. The fixture files have one, so tests trim.
 */
export function buildPreamble(p: {
  name: string;
  email: string;
  id: string;
  issued: string;
  updatesThrough: string;
  seats: number;
  licenseType: LicenseTypeSlug;
  /**
   * Billing address, already normalized to one array entry per rendered line
   * (see normalizeAddress in polar.ts). Omitted entirely when absent, which is
   * what keeps the byte parity above honest: with no address the output is
   * identical to the Swift template and the shared golden fixtures still match.
   *
   * Only licenses minted from a Polar order carry it. A licensegen-issued
   * volume license has no single billing address to state, and the app verifies
   * whatever preamble the file contains — it hashes the text rather than
   * rebuilding it — so the extra field cannot make a license fail to activate.
   */
  addressLines?: string[];
}): string {
  const field = (label: string, value: string) =>
    label.padEnd(Math.max(label.length, LABEL_COLUMN), ' ') + value;
  // Continuation lines sit under the value, not the label, so the address reads
  // as one block rather than several unlabelled fields.
  const addressBlock = (lines: string[]) => [
    field('Billing address:', lines[0]),
    ...lines.slice(1).map((l) => ' '.repeat(LABEL_COLUMN) + l),
  ];
  const isVolume = p.licenseType === 'business-volume';
  // Empty updatesThrough = updates are permanent. A blank value after
  // "Updates through:" would read as an omission on the one document a customer
  // keeps, so the LABEL changes with it. Must match the Swift copy byte for
  // byte — see app/Sources/Sealshot/Licensing/LicenseFormat.swift.
  const isPermanent = p.updatesThrough === '';
  const lines = [
    'Sealshot License',
    '='.repeat(16),
    field('Licensed to:', p.name),
    field(isVolume ? 'Purchaser email:' : 'Email:', p.email),
    ...(p.addressLines?.length ? addressBlock(p.addressLines) : []),
    field('License ID:', p.id),
    field('License type:', TYPE_LABEL[p.licenseType]),
    field('License issued:', p.issued),
    field('App access:', 'Perpetual'),
    isPermanent
      ? field('Updates:', 'All future versions')
      : field('Updates through:', p.updatesThrough),
    field(isVolume ? 'User seats:' : 'Users:', String(p.seats)),
    field('Macs per user:', String(MACS_PER_USER)),
    '',
  ];
  if (isVolume) {
    // Volume licenses omit the "Keep this file exactly as received" paragraph.
    // Asymmetric on purpose — it comes from the source document, not an
    // oversight. An org admin distributes this file internally by design.
    lines.push(
      `This is an offline, organization-wide license for up to ${p.seats} users.`,
      'Sealshot does not transmit installation or usage information.'
    );
  } else {
    lines.push(
      'This license does not expire. It permits use of every Sealshot',
      isPermanent
        ? 'release, including all future versions.'
        : `release whose entitlement date is on or before ${p.updatesThrough}.`,
      '',
      'Keep this file exactly as received. The information above is',
      'cryptographically signed; modifying it invalidates the license.'
    );
  }
  return lines.join('\n');
}
