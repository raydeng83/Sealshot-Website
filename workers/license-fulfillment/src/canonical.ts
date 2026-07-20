import { utf8ToBytes, bytesToBase64 } from './base64';

/** Port of LicenseFileFormat.canonicalize (LicenseFormat.swift:97). */
export function canonicalize(text: string): string {
  let t = text;
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  t = t.normalize('NFC');
  return t
    .split('\n')
    .map((line) => line.replace(/\s+$/u, ''))
    .join('\n');
}

/** base64(SHA256(utf8 bytes of the canonical preamble)). */
export async function textHash(preamble: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', utf8ToBytes(preamble));
  return bytesToBase64(new Uint8Array(digest));
}
