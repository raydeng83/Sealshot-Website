import { ed25519 } from '@noble/curves/ed25519';
import { canonicalize, textHash, buildPreamble } from './canonical';
import { bytesToBase64, utf8ToBytes } from './base64';

export type LicenseInput = {
  name: string;
  email: string;
  issued: string;         // yyyy-MM-dd (UTC)
  updatesThrough: string; // yyyy-MM-dd (UTC)
  seats: number;
  id: string;             // uppercase UUID
};

/** yyyy-MM-dd (UTC) + N months, deterministic (JS Date month rollover). */
export function addMonthsUTC(fromISODate: string, months: number): string {
  const [y, m, d] = fromISODate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export async function issueLicense(input: LicenseInput, privateKeyBytes: Uint8Array): Promise<string> {
  const preamble = buildPreamble({
    name: input.name, email: input.email, id: input.id,
    issued: input.issued, updatesThrough: input.updatesThrough, seats: input.seats,
  });
  // Hash the CANONICALIZED preamble (matches licensegen main.swift:197).
  const hash = await textHash(canonicalize(preamble));

  const payload = {
    id: input.id,
    name: input.name,
    email: input.email,
    edition: 'pro',
    issued: input.issued,
    updatesThrough: input.updatesThrough,
    seats: input.seats,
    textHash: hash,
  };
  const payloadBytes = utf8ToBytes(JSON.stringify(payload));
  const sig = ed25519.sign(payloadBytes, privateKeyBytes);

  const envelope = {
    v: 1,
    key: 1,
    payload: bytesToBase64(payloadBytes),
    sig: bytesToBase64(sig),
  };
  const envelopeB64 = bytesToBase64(utf8ToBytes(JSON.stringify(envelope)));
  return preamble + '\n\n' + 'SEALSHOT1.' + envelopeB64 + '\n';
}
