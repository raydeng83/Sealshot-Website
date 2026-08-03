#!/usr/bin/env -S npx tsx
/**
 * Verify the published revocation blocklist the way the APP verifies it.
 *
 *   npm run verify:blocklist
 *   npm run verify:blocklist -- --expect 65ED7FCE-AEDC-44BF-B905-B415893A83EF
 *   npm run verify:blocklist -- --file ../../../Sealshot-Release/license-blocklist.json
 *
 * Why this exists as a standing command rather than a one-off check: the app's
 * BlocklistFetcher fails open on purpose — "an unreachable blocklist must never
 * break the app" — so a 404, a malformed file, or a bad signature all degrade
 * silently to "no revocations". That is indistinguishable from "nothing has been
 * revoked yet", which is exactly how this URL stayed 404 for months without
 * anyone noticing.
 *
 * Run it after every `licensegen revoke` and commit. Exits non-zero on failure
 * so it can gate a script.
 */
import { readFileSync } from 'node:fs';
import { ed25519 } from '@noble/curves/ed25519';
import { APP_PUBLIC_KEYS } from '../../../src/lib/app-keys';

const LIVE_URL =
  'https://raw.githubusercontent.com/raydeng83/Sealshot-Release/main/license-blocklist.json';

type Blocklist = {
  v: number;
  key: number;
  revoked: string[];
  updated: string;
  sig: string;
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const fail: string[] = [];
const check = (ok: boolean, label: string, detail = '') => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) fail.push(label);
};

const localPath = arg('file');
const source = localPath ?? LIVE_URL;
console.log(`\nverifying ${source}\n`);

// ── Fetch or read ────────────────────────────────────────────────────────────
let raw: string;
if (localPath) {
  raw = readFileSync(localPath, 'utf8');
  check(true, 'read from disk', `${raw.length} bytes`);
} else {
  const res = await fetch(LIVE_URL);
  check(res.ok, `HTTP ${res.status}`, res.ok ? '' : '— the app would fail open and revoke nothing');
  if (!res.ok) process.exit(1);
  raw = await res.text();
}

// ── Decode, with the same non-optional fields the Swift structs require ──────
let list: Blocklist;
try {
  list = JSON.parse(raw);
} catch {
  check(false, 'parses as JSON');
  process.exit(1);
}

for (const [field, ok] of [
  ['v', typeof list.v === 'number'],
  ['key', typeof list.key === 'number'],
  ['revoked', Array.isArray(list.revoked)],
  ['updated', typeof list.updated === 'string'],
  ['sig', typeof list.sig === 'string'],
] as const) {
  check(ok, `field "${field}" present and correctly typed`);
}
if (fail.length) process.exit(1);

check(list.v === 1, `envelope version ${list.v}`, 'app decodes v1');

// ── The signing key must be one the app knows ────────────────────────────────
const pub = APP_PUBLIC_KEYS[list.key];
check(Boolean(pub), `signed with key ${list.key}`,
      pub ? 'known to the app' : '— app would throw unknownSigningKey');
if (!pub) process.exit(1);

// ── Signature, over the message Swift builds ─────────────────────────────────
// Blocklist.signedMessage — comma-joined SORTED uuidStrings. The empty list is
// the empty string, which is why an initial empty blocklist can be signed at all.
const message = new TextEncoder().encode(list.revoked.slice().sort().join(','));
let sigValid = false;
try {
  sigValid = ed25519.verify(
    Uint8Array.from(Buffer.from(list.sig, 'base64')),
    message,
    Uint8Array.from(Buffer.from(pub, 'base64')),
  );
} catch {
  sigValid = false;
}
check(sigValid, 'signature valid against the key the app embeds',
      sigValid ? '' : '— app would throw badSignature and revoke nothing');

// ── Sorted, because licensegen writes it sorted and the signature assumes it ──
const sorted = [...list.revoked].sort();
check(JSON.stringify(sorted) === JSON.stringify(list.revoked),
      'revoked list is sorted');

// ── Optionally assert a specific id landed ───────────────────────────────────
const expect = arg('expect');
if (expect) {
  const present = list.revoked.some((id) => id.toUpperCase() === expect.toUpperCase());
  check(present, `revokes ${expect}`,
        present ? '' : '— did the commit actually push?');
}

console.log(`\n  updated ${list.updated} · revokes ${list.revoked.length} license(s)`);
for (const id of list.revoked) console.log(`    ${id}`);

if (fail.length) {
  console.error(`\nFAILED: ${fail.join(', ')}\n`);
  process.exit(1);
}
console.log('\nOK — the app will accept this blocklist.\n');
