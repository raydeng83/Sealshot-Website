import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { ed25519 } from '@noble/curves/ed25519';
import { issueLicense } from '../src/license';
import { canonicalize, textHash } from '../src/canonical';
import { base64ToBytes, bytesToBase64 } from '../src/base64';

/**
 * Proves the Worker signs licenses the SHIPPED APP will accept.
 *
 * Every other test signs with a throwaway key, so they verify the file format
 * but not the thing that actually matters in production: that
 * `SIGNING_KEY_B64` is the private half of a key the app has embedded. Get
 * that wrong and every license sold is rejected on activation.
 *
 * The private key lives only in the developer's login Keychain, so this test
 * SKIPS anywhere it isn't available (CI, another machine). Run it on the
 * machine that holds the key, before deploying:
 *
 *   npx vitest run production-key
 *
 * Source of truth for the expected public keys:
 * app/Sources/Sealshot/Licensing/LicenseKeys.swift
 */

/** Public halves embedded in the app. Key 1 signs today; key 2 is the standby. */
const APP_PUBLIC_KEYS: Record<number, string> = {
  1: '/tjy0vqLLdg5pvQjxsQ0jd0d9i4ihlMXLPynR8qurgk=',
  2: 'rgK5y1C5cPJOlmc1AyXXFok3FJvtIgK4k9nLKIetyqs=',
};

/** The envelope's `key` field — must name a key the app knows. */
const ENVELOPE_KEY_ID = 1;

/**
 * Read the primary signing key from the login Keychain the same way
 * licensegen does (generic password, service com.seal-shot.licensegen,
 * account "primary", value = raw 32-byte Ed25519 key). Returns null when it
 * isn't there, so the suite skips instead of failing.
 */
function keyFromKeychain(): Uint8Array | null {
  let raw: string;
  try {
    raw = execFileSync(
      'security',
      ['find-generic-password', '-s', 'com.seal-shot.licensegen', '-a', 'primary', '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
  } catch {
    return null;
  }

  // `security -w` prints non-UTF8 data as hex; accept base64 and raw too.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Uint8Array.from(raw.match(/../g)!.map((h) => parseInt(h, 16)));
  }
  for (const enc of ['base64', 'utf8'] as const) {
    const buf = Buffer.from(raw, enc);
    if (buf.length === 32) return new Uint8Array(buf);
  }
  return null;
}

const priv = keyFromKeychain();
const describeIfKey = priv ? describe : describe.skip;

describeIfKey('production signing key (local only)', () => {
  it('is the private half of the public key the app embeds', () => {
    const derived = bytesToBase64(ed25519.getPublicKey(priv!));
    // If this fails, SIGNING_KEY_B64 would produce licenses the app rejects.
    expect(derived).toBe(APP_PUBLIC_KEYS[ENVELOPE_KEY_ID]);
  });

  it('issues a license the app can verify end to end', async () => {
    const file = await issueLicense(
      {
        name: 'Launch Test',
        email: 'launch-test@example.com',
        issued: '2026-08-01',
        updatesThrough: '2027-08-01',
        seats: 1,
        id: '11111111-2222-3333-4444-555555555555',
        licenseType: 'individual',
      },
      priv!
    );

    const lines = canonicalize(file).split('\n');
    const blobLine = lines.find((l) => l.startsWith('SEALSHOT1.'))!;
    expect(blobLine).toBeTruthy();

    const envelope = JSON.parse(
      new TextDecoder().decode(base64ToBytes(blobLine.slice('SEALSHOT1.'.length)))
    );
    // Envelope names a key the app actually has.
    expect(envelope.v).toBe(1);
    expect(APP_PUBLIC_KEYS[envelope.key]).toBeTruthy();
    expect(envelope.key).toBe(ENVELOPE_KEY_ID);

    // The signature verifies against the app's embedded public key — not
    // against a key derived from our own private key, which would be circular.
    const appPub = base64ToBytes(APP_PUBLIC_KEYS[envelope.key]);
    const payloadBytes = base64ToBytes(envelope.payload);
    expect(ed25519.verify(base64ToBytes(envelope.sig), payloadBytes, appPub)).toBe(true);

    // And the clear-text preamble is bound to the signed payload, so the app's
    // tamper check passes too.
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    const preamble = lines.slice(0, lines.indexOf(blobLine)).join('\n').replace(/\n+$/, '');
    expect(await textHash(canonicalize(preamble))).toBe(payload.textHash);
  });
});
