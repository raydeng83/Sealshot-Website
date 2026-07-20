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

export function buildPreamble(p: {
  name: string;
  email: string;
  id: string;
  issued: string;
  updatesThrough: string;
  seats: number;
}): string {
  const field = (label: string, value: string) =>
    label.padEnd(Math.max(label.length, 17), ' ') + value;
  return [
    'Sealshot License',
    '='.repeat(16),
    field('Licensed to:', p.name),
    field('Email:', p.email),
    field('License ID:', p.id),
    field('Issued:', p.issued),
    field('Updates through:', p.updatesThrough),
    field('Seats:', String(p.seats)),
    '',
    'Keep this file exactly as received. It is personally identifying and',
    'cryptographically bound to the information above - any change to this',
    'file, including removing this text, invalidates the license.',
  ].join('\n');
}
