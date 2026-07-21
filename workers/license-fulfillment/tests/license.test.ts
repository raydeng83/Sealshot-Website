import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { issueLicense, addMonthsUTC } from '../src/license';
import { canonicalize, textHash } from '../src/canonical';
import { base64ToBytes } from '../src/base64';

const priv = ed25519.utils.randomPrivateKey();
const pub = ed25519.getPublicKey(priv);

describe('addMonthsUTC', () => {
  it('adds 12 months', () => {
    expect(addMonthsUTC('2026-07-20', 12)).toBe('2027-07-20');
  });
  it('handles year/day overflow deterministically', () => {
    expect(addMonthsUTC('2024-12-31', 2)).toBe('2025-03-03'); // JS Date rollover, deterministic
  });
});

describe('issueLicense', () => {
  it('produces a file whose signature verifies and whose preamble hash matches', async () => {
    const file = await issueLicense(
      { name: 'Jane Doe', email: 'jane@example.com', issued: '2026-07-20',
        updatesThrough: '2027-07-20', seats: 1, id: '550E8400-E29B-41D4-A716-446655440000' },
      priv,
    );

    // File shape
    expect(file).toContain('Sealshot License');
    const canonical = canonicalize(file);
    const lines = canonical.split('\n');
    const blobLine = lines.find((l) => l.startsWith('SEALSHOT1.'))!;
    expect(blobLine).toBeTruthy();

    // Decode envelope
    const envelope = JSON.parse(
      new TextDecoder().decode(base64ToBytes(blobLine.slice('SEALSHOT1.'.length))),
    );
    expect(envelope).toMatchObject({ v: 1, key: 1 });

    // Signature verifies over the raw payload bytes
    const payloadBytes = base64ToBytes(envelope.payload);
    expect(ed25519.verify(base64ToBytes(envelope.sig), payloadBytes, pub)).toBe(true);

    // Payload fields
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    expect(payload).toMatchObject({
      edition: 'pro', email: 'jane@example.com', name: 'Jane Doe', seats: 1,
      issued: '2026-07-20', updatesThrough: '2027-07-20',
      id: '550E8400-E29B-41D4-A716-446655440000',
    });

    // Preamble hash binds to payload.textHash
    const preamble = lines.slice(0, lines.indexOf(blobLine)).join('\n').replace(/\n+$/, '');
    expect(await textHash(canonicalize(preamble))).toBe(payload.textHash);
  });
});
