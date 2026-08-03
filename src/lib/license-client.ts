import { ed25519 } from '@noble/curves/ed25519';
import { APP_PUBLIC_KEYS as PUBLIC_KEYS } from './app-keys';

/**
 * Reads and verifies a Sealshot license file in the browser.
 *
 * This is a CONFIRMATION SURFACE, not a security control. Its only job is to
 * let the renewal page show the customer what they are about to extend, backed
 * by a signature rather than by a UUID they cannot check by eye. The Polar
 * checkout link can be reached directly with any reference id, so the Worker
 * matches independently and never trusts anything decided here.
 *
 * The file is never transmitted. Publishing the verifying keys exposes nothing
 * — they are public halves, and every shipped app binary already contains them.
 */


const BLOB_PREFIX = 'SEALSHOT1.';

export type LicenseTypeSlug = 'individual' | 'business-volume';

export type LicensePayload = {
  id: string;
  name: string;
  email: string;
  licenseType: LicenseTypeSlug;
  issued: string;
  updatesThrough: string;
  seats: number;
  textHash: string;
};

export type VerifyFailure =
  | 'notALicense'    // no SEALSHOT1 blob — probably the wrong file
  | 'malformed'      // blob present but unreadable
  | 'unknownKey'     // signed by a key this page doesn't know
  | 'badSignature'   // signature doesn't verify
  | 'textTampered';  // preamble edited after signing

export type VerifyResult =
  | { ok: true; payload: LicensePayload }
  | { ok: false; reason: VerifyFailure };

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Unicode White_Space, matching Swift's Character.isWhitespace — NOT JS's `\s`.
 * U+FEFF is excluded (JS `\s` wrongly trims it) and U+0085 included (JS `\s`
 * misses it). Port of LicenseFileFormat.canonicalize; a mismatch here shows up
 * as a bogus `textTampered` on a perfectly good license.
 */
const TRAILING_WHITESPACE = new RegExp(
  '[\\t\\n\\v\\f\\r\\u0020\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+$',
  'u'
);

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

async function textHash(preamble: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(preamble));
  let bin = '';
  const bytes = new Uint8Array(digest);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function verifyLicenseFile(
  fileText: string,
  /**
   * Key id → base64 public key. Defaults to the shipped production keys;
   * overridden only by tests, which sign with a throwaway key so the happy path
   * can be exercised without committing a real, usable license to the repo.
   */
  publicKeys: Record<number, string> = PUBLIC_KEYS
): Promise<VerifyResult> {
  const canonical = canonicalize(fileText);
  const lines = canonical.split('\n');
  const blobIndex = lines.findIndex((l) => l.startsWith(BLOB_PREFIX));
  if (blobIndex === -1) return { ok: false, reason: 'notALicense' };

  let payload: LicensePayload;
  let sig: Uint8Array;
  let payloadBytes: Uint8Array;
  let keyId: number;
  try {
    const envelope = JSON.parse(
      new TextDecoder().decode(base64ToBytes(lines[blobIndex].slice(BLOB_PREFIX.length)))
    );
    keyId = envelope.key;
    payloadBytes = base64ToBytes(envelope.payload);
    sig = base64ToBytes(envelope.sig);
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const pub = publicKeys[keyId];
  if (!pub) return { ok: false, reason: 'unknownKey' };

  // Verify over the bytes as received — never re-serialize the payload, or key
  // order would change the signed input.
  let signatureValid = false;
  try {
    signatureValid = ed25519.verify(sig, payloadBytes, base64ToBytes(pub));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!signatureValid) return { ok: false, reason: 'badSignature' };

  // The preamble is bound to the signed payload by its hash, so editing the
  // readable text invalidates the file even though the signature still checks.
  const preamble = lines.slice(0, blobIndex).join('\n').replace(/\n+$/, '');
  if ((await textHash(canonicalize(preamble))) !== payload.textHash) {
    return { ok: false, reason: 'textTampered' };
  }

  return { ok: true, payload };
}

/** Renewals are always 12 months; the founding term is for first purchases. */
export const RENEWAL_MONTHS = 12;

/** Port of addMonthsUTC — same JS Date rollover, so the same answer. */
export function addMonthsUTC(fromISODate: string, months: number): string {
  const [y, m, d] = fromISODate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return [
    dt.getUTCFullYear(),
    String(dt.getUTCMonth() + 1).padStart(2, '0'),
    String(dt.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Mirrors the Worker's renewalThrough: extend from whichever is later, the
 * existing window or today. Shown before payment, so it has to agree with what
 * the Worker will actually issue.
 */
export function projectedThrough(existingThrough: string, today: string): string {
  const base = existingThrough > today ? existingThrough : today;
  return addMonthsUTC(base, RENEWAL_MONTHS);
}

export function todayUTC(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** yyyy-MM-dd → "20 July 2027", for display only. */
export function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
