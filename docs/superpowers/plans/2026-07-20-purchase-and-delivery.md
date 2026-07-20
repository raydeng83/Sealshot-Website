# Purchase & Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell Sealshot on the website via Polar and automatically deliver a signed `.sealshotlicense` file by email after payment.

**Architecture:** A new Cloudflare Worker (`workers/license-fulfillment/`) receives Polar's `order.paid` webhook, mints a signed license (a TypeScript port of the Swift `licensegen` format), emails it via Resend, and records the order for idempotency. The existing Astro site gets a static `/buy` page driven by a reusable promo config. The Worker is the only place secrets live.

**Tech Stack:** TypeScript, Cloudflare Workers (`wrangler`), Vitest, `@noble/curves` (Ed25519), Web Crypto (SHA-256), Resend (email), Cloudflare KV (idempotency store), Astro (existing site), Polar (payments / merchant of record).

## Global Constraints

- License format must remain **byte-compatible with the app's verifier**. Source of truth: `/Users/ledeng/projects/sealshot/app/Sources/Sealshot/Licensing/LicenseFormat.swift`, `LicenseVerifier.swift`, `LicenseKeys.swift`, and `/Users/ledeng/projects/sealshot/scripts/licensegen/Sources/licensegen/main.swift`. Do not change the app; the Worker conforms to it.
- Signature scheme: **Ed25519 (Curve25519)** over the **raw payload JSON bytes**. The verifier decodes the base64 `payload` back to bytes and checks the signature over those exact bytes — it never re-serializes — so the TS payload serialization only needs to be self-consistent and JSON-decodable by Swift, **not** byte-identical to Swift's encoder.
- The **preamble** and its **`textHash`** DO require exact parity (17-char label padding, exact line text, exact canonicalization), because `textHash = base64(SHA256(canonicalize(preamble)))` is recomputed by the app and compared.
- Production public key **1** (base64, 32-byte raw): `/tjy0vqLLdg5pvQjxsQ0jd0d9i4ihlMXLPynR8qurgk=`. This is the key the Worker's private key must correspond to (envelope `key: 1`).
- License fields: `edition = "pro"`, `seats = 1`, `issued` = paid date `yyyy-MM-dd` (UTC), `updatesThrough` = paid date + 12 months `yyyy-MM-dd` (UTC).
- Envelope constants: `v = 1`, `key = 1`, blob prefix `SEALSHOT1.`, file layout `preamble + "\n\n" + "SEALSHOT1." + base64(envelopeJSON) + "\n"`.
- Regular price **$29.99** (2999 cents); launch promo **$14.99** (1499 cents). Polar is authoritative on the amount charged; the promo config controls display + checkout link only.
- Node 20+ for the Worker toolchain; `wrangler` v3+.

---

## File Structure

**New Worker package** (`workers/license-fulfillment/` in this repo — deployed separately from the Astro site):
- `package.json`, `tsconfig.json`, `wrangler.toml`, `vitest.config.ts`
- `src/base64.ts` — base64 ↔ bytes helpers (Worker-safe)
- `src/canonical.ts` — `canonicalize`, `textHash`, `buildPreamble` (port of Swift format helpers)
- `src/license.ts` — `issueLicense()` (payload + sign + envelope + file text)
- `src/verify.ts` — `verifyLicenseFile()` (TS mirror of `LicenseVerifier`, for tests + idempotent re-checks)
- `src/polar.ts` — `verifyPolarSignature()`, `parseOrderPaid()`
- `src/email.ts` — `sendLicenseEmail()` (Resend)
- `src/store.ts` — `getOrder()`, `putOrder()` (KV idempotency)
- `src/index.ts` — `fetch` handler wiring the webhook flow
- `tests/*.test.ts` — one per module
- `tests/fixtures/parity.sealshotlicense` — a **real** `licensegen`-issued sample (committed) the TS verifier must accept

**Website (existing Astro repo):**
- `src/config/promos.ts` — promo list + `activePromo()` + `REGULAR_PRICE_CENTS`
- `src/pages/buy.astro` — the buy page
- `tests/promos.test.ts` + root `vitest.config.ts` — unit test for promo selection
- `package.json` — add `vitest` devDependency + `test` script

**One-off setup script (this repo):**
- `scripts/export-signing-key.swift` — reads the Ed25519 private key from the founder's Keychain and prints its base64 raw representation (for the Worker secret)

---

## Prerequisites (one-time, manual — done during Task 12)

These are external and don't block writing code, but the Worker can't go live without them:
- Polar account + product ($29.99 one-time) + a launch discount ($14.99) + webhook pointed at the deployed Worker URL, with the webhook signing secret.
- Resend account + verified sending domain (e.g. `mail.seal-shot.com`) + API key.
- The Ed25519 private key exported from the Keychain as base64 (Task 12 uses `scripts/export-signing-key.swift`).
- A Cloudflare KV namespace bound as `ORDERS`.

---

### Task 1: Worker scaffold + base64 helpers

**Files:**
- Create: `workers/license-fulfillment/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/base64.ts`
- Test: `workers/license-fulfillment/tests/base64.test.ts`

**Interfaces:**
- Produces: `bytesToBase64(bytes: Uint8Array): string`, `base64ToBytes(b64: string): Uint8Array`, `utf8ToBytes(s: string): Uint8Array`

- [ ] **Step 1: Create the package**

`workers/license-fulfillment/package.json`:
```json
{
  "name": "license-fulfillment",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "wrangler": "^3.60.0",
    "typescript": "^5.4.0"
  },
  "dependencies": {
    "@noble/curves": "^1.4.0"
  }
}
```

`workers/license-fulfillment/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

`workers/license-fulfillment/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] **Step 2: Write the failing test**

`workers/license-fulfillment/tests/base64.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { bytesToBase64, base64ToBytes, utf8ToBytes } from '../src/base64';

describe('base64', () => {
  it('round-trips bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
  it('encodes known ascii', () => {
    expect(bytesToBase64(utf8ToBytes('hi'))).toBe('aGk=');
  });
  it('encodes multibyte utf8', () => {
    // "é" is 0xC3 0xA9
    expect(bytesToBase64(utf8ToBytes('é'))).toBe('w6k=');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd workers/license-fulfillment && npm install && npm test -- base64`
Expected: FAIL — cannot find module `../src/base64`.

- [ ] **Step 4: Implement**

`workers/license-fulfillment/src/base64.ts`:
```ts
export function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- base64`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add workers/license-fulfillment
git commit -m "feat(worker): scaffold license-fulfillment + base64 helpers"
```

---

### Task 2: Canonicalize + textHash (Swift parity)

**Files:**
- Create: `workers/license-fulfillment/src/canonical.ts`
- Test: `workers/license-fulfillment/tests/canonical.test.ts`

**Interfaces:**
- Consumes: `utf8ToBytes`, `bytesToBase64` (Task 1)
- Produces: `canonicalize(text: string): string`, `textHash(preamble: string): Promise<string>`

Port of `LicenseFileFormat.canonicalize` / `.textHash` (`LicenseFormat.swift:97-133`): strip BOM, CRLF/CR→LF, NFC-normalize, trim trailing whitespace per line, join with `\n`; `textHash = base64(SHA256(utf8(canonical preamble)))`.

- [ ] **Step 1: Write the failing test**

`workers/license-fulfillment/tests/canonical.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { canonicalize, textHash } from '../src/canonical';

describe('canonicalize', () => {
  it('strips BOM, normalizes CRLF, trims trailing ws', () => {
    expect(canonicalize('﻿a \r\nb\t\r\nc')).toBe('a\nb\nc');
  });
  it('NFC-normalizes (decomposed é -> composed)', () => {
    const decomposed = 'é'; // e + combining acute
    expect(canonicalize(decomposed)).toBe('é');
  });
});

describe('textHash', () => {
  it('matches SHA256/base64 of the canonical bytes', async () => {
    // echo -n "abc" | openssl dgst -sha256 -binary | base64
    expect(await textHash('abc')).toBe('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- canonical`
Expected: FAIL — cannot find module `../src/canonical`.

- [ ] **Step 3: Implement**

`workers/license-fulfillment/src/canonical.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- canonical`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/license-fulfillment/src/canonical.ts workers/license-fulfillment/tests/canonical.test.ts
git commit -m "feat(worker): port canonicalize + textHash from Swift"
```

---

### Task 3: buildPreamble (Swift parity)

**Files:**
- Modify: `workers/license-fulfillment/src/canonical.ts`
- Test: `workers/license-fulfillment/tests/preamble.test.ts`

**Interfaces:**
- Produces: `buildPreamble(p: { name: string; email: string; id: string; issued: string; updatesThrough: string; seats: number }): string`

Port of `buildPreamble` (`LicenseFormat.swift:139` / `main.swift:79`): labels padded to a 17-char column, exact line text, joined with `\n`. Note the trailing instructional lines and the blank line before them.

- [ ] **Step 1: Write the failing test**

`workers/license-fulfillment/tests/preamble.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildPreamble } from '../src/canonical';

describe('buildPreamble', () => {
  it('matches the exact Swift template', () => {
    const out = buildPreamble({
      name: 'Jane Doe',
      email: 'jane@example.com',
      id: '550E8400-E29B-41D4-A716-446655440000',
      issued: '2026-07-20',
      updatesThrough: '2027-07-20',
      seats: 1,
    });
    const expected = [
      'Sealshot License',
      '================',
      'Licensed to:     Jane Doe',
      'Email:           jane@example.com',
      'License ID:      550E8400-E29B-41D4-A716-446655440000',
      'Issued:          2026-07-20',
      'Updates through: 2027-07-20',
      'Seats:           1',
      '',
      'Keep this file exactly as received. It is personally identifying and',
      'cryptographically bound to the information above - any change to this',
      'file, including removing this text, invalidates the license.',
    ].join('\n');
    expect(out).toBe(expected);
  });
});
```

Note: `'================'` is 16 `=` (Swift `String(repeating: "=", count: 16)`). Labels pad to 17 chars: `'Licensed to:'` (12) + 5 spaces; `'Updates through:'` (16) + 1 space; `'License ID:'` (11) + 6 spaces.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- preamble`
Expected: FAIL — `buildPreamble` is not exported.

- [ ] **Step 3: Implement (append to `src/canonical.ts`)**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- preamble`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/license-fulfillment/src/canonical.ts workers/license-fulfillment/tests/preamble.test.ts
git commit -m "feat(worker): port buildPreamble template from Swift"
```

---

### Task 4: issueLicense — payload, Ed25519 sign, envelope, file text

**Files:**
- Create: `workers/license-fulfillment/src/license.ts`
- Test: `workers/license-fulfillment/tests/license.test.ts`

**Interfaces:**
- Consumes: `canonicalize`, `textHash`, `buildPreamble` (Tasks 2–3); `bytesToBase64`, `utf8ToBytes` (Task 1)
- Produces:
  - `type LicenseInput = { name: string; email: string; issued: string; updatesThrough: string; seats: number; id: string }`
  - `issueLicense(input: LicenseInput, privateKeyBytes: Uint8Array): Promise<string>` — returns full `.sealshotlicense` file text
  - `addMonthsUTC(fromISODate: string, months: number): string` — `yyyy-MM-dd` (UTC) arithmetic

Signing uses `@noble/curves/ed25519`. The signature is over the raw bytes of `JSON.stringify(payload)`; those same bytes are base64'd into `envelope.payload`. Envelope `{ v: 1, key: 1, payload, sig }`.

- [ ] **Step 1: Write the failing test** (signs with a throwaway key, self-verifies the signature and structure)

`workers/license-fulfillment/tests/license.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { issueLicense, addMonthsUTC } from '../src/license';
import { canonicalize, textHash } from '../src/canonical';
import { base64ToBytes, utf8ToBytes } from '../src/base64';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- license`
Expected: FAIL — cannot find module `../src/license`.

- [ ] **Step 3: Implement**

`workers/license-fulfillment/src/license.ts`:
```ts
import { ed25519 } from '@noble/curves/ed25519';
import { canonicalize, textHash, buildPreamble } from './canonical';
import { bytesToBase64, base64ToBytes, utf8ToBytes } from './base64';

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- license`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/license-fulfillment/src/license.ts workers/license-fulfillment/tests/license.test.ts
git commit -m "feat(worker): issueLicense — sign + envelope + file assembly"
```

---

### Task 5: TS verifier + real Swift golden-file parity

**Files:**
- Create: `workers/license-fulfillment/src/verify.ts`
- Create: `workers/license-fulfillment/tests/fixtures/parity.sealshotlicense` (real `licensegen` output — see Step 1)
- Test: `workers/license-fulfillment/tests/verify.test.ts`

**Interfaces:**
- Produces:
  - `type VerifyResult = { ok: true; payload: LicensePayloadJSON } | { ok: false; error: string }`
  - `type LicensePayloadJSON = { id: string; name: string; email: string; edition: string; issued: string; updatesThrough: string; seats: number; textHash: string }`
  - `verifyLicenseFile(fileText: string, publicKeysByKeyId: Record<number, Uint8Array>): Promise<VerifyResult>`

This is a TS mirror of `LicenseVerifier.verify(fileText:)`. Its purpose is (a) an automated parity gate against a **real Swift-produced** license using the **real public key**, proving the canonicalize/textHash/JSON-decode path matches; and (b) re-verifying stored licenses in the fulfillment flow.

- [ ] **Step 1: Generate the golden fixture (manual, one-time, on the founder's Mac)**

Run:
```bash
cd /Users/ledeng/projects/sealshot/scripts/licensegen
swift run licensegen issue --name "Parity Test" --email "parity@example.com" --seats 1 --months 12 \
  > /Users/ledeng/projects/Sealshot-Website/workers/license-fulfillment/tests/fixtures/parity.sealshotlicense
```
This writes a real signed license (signed by production key 1). Committing it is safe — it contains only test identity and a public-verifiable signature.

- [ ] **Step 2: Write the failing test**

`workers/license-fulfillment/tests/verify.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { verifyLicenseFile } from '../src/verify';
import { issueLicense } from '../src/license';
import { base64ToBytes } from '../src/base64';
import { ed25519 } from '@noble/curves/ed25519';

// Production public keys from LicenseKeys.swift
const PROD_KEYS: Record<number, Uint8Array> = {
  1: base64ToBytes('/tjy0vqLLdg5pvQjxsQ0jd0d9i4ihlMXLPynR8qurgk='),
  2: base64ToBytes('rgK5y1C5cPJOlmc1AyXXFok3FJvtIgK4k9nLKIetyqs='),
};

describe('verifyLicenseFile', () => {
  it('accepts a REAL licensegen-issued file (Swift → TS parity)', async () => {
    const file = readFileSync(new URL('./fixtures/parity.sealshotlicense', import.meta.url), 'utf8');
    const res = await verifyLicenseFile(file, PROD_KEYS);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.email).toBe('parity@example.com');
      expect(res.payload.edition).toBe('pro');
    }
  });

  it('rejects a file whose preamble was edited (textTampered)', async () => {
    const file = readFileSync(new URL('./fixtures/parity.sealshotlicense', import.meta.url), 'utf8');
    const tampered = file.replace('Parity Test', 'Someone Else');
    const res = await verifyLicenseFile(tampered, PROD_KEYS);
    expect(res).toEqual({ ok: false, error: 'textTampered' });
  });

  it('accepts a TS-issued file signed by a matching key', async () => {
    const priv = ed25519.utils.randomPrivateKey();
    const pub = ed25519.getPublicKey(priv);
    const file = await issueLicense(
      { name: 'A B', email: 'a@b.com', issued: '2026-01-01', updatesThrough: '2027-01-01', seats: 1,
        id: '11111111-1111-1111-1111-111111111111' }, priv);
    const res = await verifyLicenseFile(file, { 1: pub });
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- verify`
Expected: FAIL — cannot find module `../src/verify`.

- [ ] **Step 4: Implement**

`workers/license-fulfillment/src/verify.ts`:
```ts
import { ed25519 } from '@noble/curves/ed25519';
import { canonicalize, textHash } from './canonical';
import { base64ToBytes } from './base64';

export type LicensePayloadJSON = {
  id: string; name: string; email: string; edition: string;
  issued: string; updatesThrough: string; seats: number; textHash: string;
};
export type VerifyResult =
  | { ok: true; payload: LicensePayloadJSON }
  | { ok: false; error: 'malformed' | 'unknownSigningKey' | 'badSignature' | 'textTampered' };

const PREFIX = 'SEALSHOT1.';

/** Mirror of LicenseVerifier.verify(fileText:) (LicenseVerifier.swift:23). */
export async function verifyLicenseFile(
  fileText: string,
  publicKeysByKeyId: Record<number, Uint8Array>,
): Promise<VerifyResult> {
  const canonical = canonicalize(fileText);
  const lines = canonical.split('\n');
  const blobIdx = lines.findIndex((l) => l.startsWith(PREFIX));
  if (blobIdx === -1) return { ok: false, error: 'malformed' };
  if (!lines.slice(blobIdx + 1).every((l) => l === '')) return { ok: false, error: 'malformed' };
  let pre = lines.slice(0, blobIdx);
  while (pre.length && pre[pre.length - 1] === '') pre.pop();
  if (pre.length === 0) return { ok: false, error: 'malformed' };
  const preamble = pre.join('\n');
  const blobB64 = lines[blobIdx].slice(PREFIX.length);

  let envelope: { v: number; key: number; payload: string; sig: string };
  try {
    envelope = JSON.parse(new TextDecoder().decode(base64ToBytes(blobB64)));
  } catch {
    return { ok: false, error: 'malformed' };
  }
  const pub = publicKeysByKeyId[envelope.key];
  if (!pub) return { ok: false, error: 'unknownSigningKey' };

  const payloadBytes = base64ToBytes(envelope.payload);
  const sig = base64ToBytes(envelope.sig);
  if (!ed25519.verify(sig, payloadBytes, pub)) return { ok: false, error: 'badSignature' };

  let payload: LicensePayloadJSON;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return { ok: false, error: 'malformed' };
  }
  if ((await textHash(preamble)) !== payload.textHash) return { ok: false, error: 'textTampered' };
  return { ok: true, payload };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- verify`
Expected: PASS (3 tests). **If the first test fails, the port has drifted from Swift — stop and reconcile before proceeding.**

- [ ] **Step 6: Commit**

```bash
git add workers/license-fulfillment/src/verify.ts workers/license-fulfillment/tests/verify.test.ts workers/license-fulfillment/tests/fixtures/parity.sealshotlicense
git commit -m "feat(worker): TS verifier + real Swift golden-file parity test"
```

---

### Task 6: Polar webhook signature verification + parsing

**Files:**
- Create: `workers/license-fulfillment/src/polar.ts`
- Test: `workers/license-fulfillment/tests/polar.test.ts`

**Interfaces:**
- Produces:
  - `verifyPolarSignature(rawBody: string, headers: Headers, secret: string): Promise<boolean>`
  - `parseOrderPaid(rawBody: string): { orderId: string; email: string; name: string; paidAtISO: string } | null`

Polar signs webhooks with the Standard Webhooks spec (HMAC-SHA256; header `webhook-signature` = space-separated `v1,<base64sig>` values, signed over `${webhook-id}.${webhook-timestamp}.${rawBody}`, with the secret base64-decoded after a `whsec_` prefix strip). Confirm exact header names against Polar docs at implementation time; the test pins the algorithm.

- [ ] **Step 1: Write the failing test**

`workers/license-fulfillment/tests/polar.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { verifyPolarSignature, parseOrderPaid } from '../src/polar';
import { bytesToBase64, utf8ToBytes } from '../src/base64';

async function sign(secretB64: string, id: string, ts: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0)),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return bytesToBase64(new Uint8Array(mac));
}

const SECRET_B64 = btoa('supersecretkey_padded_to_bytes__');

describe('verifyPolarSignature', () => {
  it('accepts a correctly signed body', async () => {
    const body = '{"type":"order.paid"}';
    const id = 'msg_1', ts = '1721470000';
    const sig = await sign(SECRET_B64, id, ts, body);
    const headers = new Headers({
      'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${sig}`,
    });
    expect(await verifyPolarSignature(body, headers, `whsec_${SECRET_B64}`)).toBe(true);
  });
  it('rejects a tampered body', async () => {
    const id = 'msg_1', ts = '1721470000';
    const sig = await sign(SECRET_B64, id, ts, '{"type":"order.paid"}');
    const headers = new Headers({
      'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${sig}`,
    });
    expect(await verifyPolarSignature('{"type":"evil"}', headers, `whsec_${SECRET_B64}`)).toBe(false);
  });
});

describe('parseOrderPaid', () => {
  it('extracts order id, email, name, paid date', () => {
    const body = JSON.stringify({
      type: 'order.paid',
      data: { id: 'ord_123', created_at: '2026-07-20T10:00:00Z',
              customer: { email: 'buyer@example.com', name: 'Buy Er' } },
    });
    expect(parseOrderPaid(body)).toEqual({
      orderId: 'ord_123', email: 'buyer@example.com', name: 'Buy Er', paidAtISO: '2026-07-20T10:00:00Z',
    });
  });
  it('returns null for non-order.paid', () => {
    expect(parseOrderPaid(JSON.stringify({ type: 'order.refunded' }))).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- polar`
Expected: FAIL — cannot find module `../src/polar`.

- [ ] **Step 3: Implement**

`workers/license-fulfillment/src/polar.ts`:
```ts
import { utf8ToBytes } from './base64';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Standard Webhooks HMAC-SHA256 verification (Polar). */
export async function verifyPolarSignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigHeader = headers.get('webhook-signature');
  if (!id || !ts || !sigHeader) return false;

  const secretB64 = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const keyBytes = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${rawBody}`));
  let expected = '';
  const macBytes = new Uint8Array(mac);
  for (let i = 0; i < macBytes.length; i++) expected += String.fromCharCode(macBytes[i]);
  const expectedB64 = btoa(expected);

  // Header may contain multiple space-separated `v1,<sig>` entries.
  return sigHeader.split(' ').some((entry) => {
    const [, sig] = entry.split(',');
    return sig ? timingSafeEqual(sig, expectedB64) : false;
  });
}

export function parseOrderPaid(rawBody: string): { orderId: string; email: string; name: string; paidAtISO: string } | null {
  let evt: any;
  try { evt = JSON.parse(rawBody); } catch { return null; }
  if (evt?.type !== 'order.paid' || !evt?.data) return null;
  const d = evt.data;
  const email = d.customer?.email ?? d.customer_email;
  const name = d.customer?.name ?? d.customer_name ?? '';
  const orderId = d.id;
  const paidAtISO = d.created_at ?? d.paid_at;
  if (!email || !orderId || !paidAtISO) return null;
  return { orderId, email, name, paidAtISO };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- polar`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/license-fulfillment/src/polar.ts workers/license-fulfillment/tests/polar.test.ts
git commit -m "feat(worker): Polar webhook signature verify + order.paid parsing"
```

---

### Task 7: KV idempotency store

**Files:**
- Create: `workers/license-fulfillment/src/store.ts`
- Test: `workers/license-fulfillment/tests/store.test.ts`

**Interfaces:**
- Produces:
  - `type OrderRecord = { licenseId: string; email: string; issued: string; state: 'sent' | 'pending' }`
  - `getOrder(kv: KVNamespace, orderId: string): Promise<OrderRecord | null>`
  - `putOrder(kv: KVNamespace, orderId: string, rec: OrderRecord): Promise<void>`

- [ ] **Step 1: Write the failing test** (uses a tiny in-memory KV stub)

`workers/license-fulfillment/tests/store.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getOrder, putOrder, type OrderRecord } from '../src/store';

function fakeKV() {
  const m = new Map<string, string>();
  return {
    get: async (k: string) => m.get(k) ?? null,
    put: async (k: string, v: string) => void m.set(k, v),
  } as unknown as KVNamespace;
}

describe('store', () => {
  it('round-trips an order record', async () => {
    const kv = fakeKV();
    const rec: OrderRecord = { licenseId: 'lic1', email: 'a@b.com', issued: '2026-07-20', state: 'sent' };
    expect(await getOrder(kv, 'ord_1')).toBeNull();
    await putOrder(kv, 'ord_1', rec);
    expect(await getOrder(kv, 'ord_1')).toEqual(rec);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- store`
Expected: FAIL — cannot find module `../src/store`.

- [ ] **Step 3: Implement**

`workers/license-fulfillment/src/store.ts`:
```ts
export type OrderRecord = {
  licenseId: string;
  email: string;
  issued: string;
  state: 'sent' | 'pending';
};

const keyFor = (orderId: string) => `order:${orderId}`;

export async function getOrder(kv: KVNamespace, orderId: string): Promise<OrderRecord | null> {
  const raw = await kv.get(keyFor(orderId));
  return raw ? (JSON.parse(raw) as OrderRecord) : null;
}

export async function putOrder(kv: KVNamespace, orderId: string, rec: OrderRecord): Promise<void> {
  await kv.put(keyFor(orderId), JSON.stringify(rec));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- store`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/license-fulfillment/src/store.ts workers/license-fulfillment/tests/store.test.ts
git commit -m "feat(worker): KV idempotency store for orders"
```

---

### Task 8: Resend email with attachment

**Files:**
- Create: `workers/license-fulfillment/src/email.ts`
- Test: `workers/license-fulfillment/tests/email.test.ts`

**Interfaces:**
- Produces: `sendLicenseEmail(args: { apiKey: string; from: string; to: string; name: string; fileName: string; fileText: string; fetchImpl?: typeof fetch }): Promise<{ ok: boolean; status: number }>`

Sends via Resend's `POST https://api.resend.com/emails` with the license as a base64 attachment. `fetchImpl` is injectable for testing.

- [ ] **Step 1: Write the failing test**

`workers/license-fulfillment/tests/email.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { sendLicenseEmail } from '../src/email';

describe('sendLicenseEmail', () => {
  it('posts to Resend with a base64 attachment', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'e1' }), { status: 200 }));
    const res = await sendLicenseEmail({
      apiKey: 'rk', from: 'Sealshot <license@mail.seal-shot.com>', to: 'buyer@example.com',
      name: 'Buy Er', fileName: 'buyer@example.com.sealshotlicense', fileText: 'FILE',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(res).toEqual({ ok: true, status: 200 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toBe('buyer@example.com');
    expect(body.attachments[0].filename).toBe('buyer@example.com.sealshotlicense');
    expect(atob(body.attachments[0].content)).toBe('FILE');
  });
  it('reports non-ok status', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 422 }));
    const res = await sendLicenseEmail({
      apiKey: 'rk', from: 'x', to: 'y', name: 'n', fileName: 'f', fileText: 'F',
      fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- email`
Expected: FAIL — cannot find module `../src/email`.

- [ ] **Step 3: Implement**

`workers/license-fulfillment/src/email.ts`:
```ts
import { bytesToBase64, utf8ToBytes } from './base64';

export async function sendLicenseEmail(args: {
  apiKey: string; from: string; to: string; name: string;
  fileName: string; fileText: string; fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; status: number }> {
  const doFetch = args.fetchImpl ?? fetch;
  const body = {
    from: args.from,
    to: args.to,
    subject: 'Your Sealshot license',
    text:
      `Hi ${args.name || 'there'},\n\n` +
      `Thanks for buying Sealshot. Your license is attached as ${args.fileName}.\n\n` +
      `To activate: open Sealshot, go to Settings ▸ License, then open the attached ` +
      `file or drag it onto the window.\n\n` +
      `Keep this file — it is your proof of purchase.\n\n— Sealshot`,
    attachments: [{ filename: args.fileName, content: bytesToBase64(utf8ToBytes(args.fileText)) }],
  };
  const resp = await doFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: resp.ok, status: resp.status };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- email`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/license-fulfillment/src/email.ts workers/license-fulfillment/tests/email.test.ts
git commit -m "feat(worker): Resend license-delivery email with attachment"
```

---

### Task 9: fetch handler wiring (webhook → issue → email → store)

**Files:**
- Create: `workers/license-fulfillment/src/index.ts`, `workers/license-fulfillment/wrangler.toml`
- Test: `workers/license-fulfillment/tests/handler.test.ts`

**Interfaces:**
- Consumes: all prior modules
- Produces: `default { fetch(request, env): Promise<Response> }` with `Env = { ORDERS: KVNamespace; SIGNING_KEY_B64: string; POLAR_WEBHOOK_SECRET: string; RESEND_API_KEY: string; EMAIL_FROM: string }`

**Flow (order.paid):** verify signature → parse → idempotency (re-send stored license, still 200) → issue → email → store `sent`/`pending`. On email failure return 500 so Polar retries. On bad signature return 401.

- [ ] **Step 1: Write the failing test** (exercises the handler with injected env + a signed body)

`workers/license-fulfillment/tests/handler.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToBase64, utf8ToBytes } from '../src/base64';

function fakeKV() {
  const m = new Map<string, string>();
  return { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => void m.set(k, v) } as unknown as KVNamespace;
}
const SECRET_RAW = 'unit_test_secret_key_padding____';
const SECRET_B64 = btoa(SECRET_RAW);

async function signedRequest(body: string, secretB64: string) {
  const id = 'msg_1', ts = '1721470000';
  const key = await crypto.subtle.importKey('raw', utf8ToBytes(atob(secretB64)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${id}.${ts}.${body}`));
  return new Request('https://w/webhooks/polar', {
    method: 'POST', body,
    headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${bytesToBase64(new Uint8Array(mac))}` },
  });
}

function makeEnv(fetchImpl: typeof fetch) {
  const priv = ed25519.utils.randomPrivateKey();
  return {
    env: {
      ORDERS: fakeKV(),
      SIGNING_KEY_B64: bytesToBase64(priv),
      POLAR_WEBHOOK_SECRET: `whsec_${SECRET_B64}`,
      RESEND_API_KEY: 'rk',
      EMAIL_FROM: 'Sealshot <license@mail.seal-shot.com>',
      FETCH: fetchImpl,
    },
  };
}

const ORDER = JSON.stringify({
  type: 'order.paid',
  data: { id: 'ord_1', created_at: '2026-07-20T10:00:00Z', customer: { email: 'buyer@example.com', name: 'Buy Er' } },
});

describe('worker handler', () => {
  it('issues + emails on a valid order.paid, returns 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('is idempotent: second delivery does not mint a new license, still 200', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const req1 = await signedRequest(ORDER, SECRET_B64);
    const req2 = await signedRequest(ORDER, SECRET_B64);
    expect((await worker.fetch(req1, env)).status).toBe(200);
    expect((await worker.fetch(req2, env)).status).toBe(200);
    // one email per delivery is fine; the key assertion is a single stored license id
    const rec = JSON.parse((await env.ORDERS.get('order:ord_1'))!);
    expect(rec.state).toBe('sent');
  });

  it('rejects a bad signature with 401', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, btoa('the_wrong_secret_key_padding___')), env);
    expect(res.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns 500 when email fails (so Polar retries)', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    const { env } = makeEnv(fetchImpl as unknown as typeof fetch);
    const res = await worker.fetch(await signedRequest(ORDER, SECRET_B64), env);
    expect(res.status).toBe(500);
    const rec = JSON.parse((await env.ORDERS.get('order:ord_1'))!);
    expect(rec.state).toBe('pending');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- handler`
Expected: FAIL — cannot find module `../src/index`.

- [ ] **Step 3: Implement**

`workers/license-fulfillment/src/index.ts`:
```ts
import { verifyPolarSignature, parseOrderPaid } from './polar';
import { issueLicense, addMonthsUTC } from './license';
import { sendLicenseEmail } from './email';
import { getOrder, putOrder } from './store';
import { base64ToBytes } from './base64';

export interface Env {
  ORDERS: KVNamespace;
  SIGNING_KEY_B64: string;
  POLAR_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  FETCH?: typeof fetch; // test injection only
}

function isoToUTCDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/webhooks/polar') {
      return new Response('not found', { status: 404 });
    }
    const rawBody = await request.text();
    if (!(await verifyPolarSignature(rawBody, request.headers, env.POLAR_WEBHOOK_SECRET))) {
      return new Response('bad signature', { status: 401 });
    }
    const order = parseOrderPaid(rawBody);
    if (!order) return new Response('ignored', { status: 200 }); // non-order.paid or unparsable-but-signed

    const fetchImpl = env.FETCH ?? fetch;
    const priv = base64ToBytes(env.SIGNING_KEY_B64);
    const issued = isoToUTCDay(order.paidAtISO);
    const updatesThrough = addMonthsUTC(issued, 12);
    const fileName = `${order.email}.sealshotlicense`;

    // Idempotency: reuse the stored license id if we've seen this order.
    const existing = await getOrder(env.ORDERS, order.orderId);
    const id = existing?.licenseId ?? crypto.randomUUID().toUpperCase();

    const fileText = await issueLicense(
      { name: order.name, email: order.email, issued, updatesThrough, seats: 1, id }, priv);

    const emailRes = await sendLicenseEmail({
      apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, to: order.email, name: order.name,
      fileName, fileText, fetchImpl,
    });

    await putOrder(env.ORDERS, order.orderId, {
      licenseId: id, email: order.email, issued, state: emailRes.ok ? 'sent' : 'pending',
    });

    if (!emailRes.ok) return new Response('email failed', { status: 500 }); // Polar retries
    return new Response('ok', { status: 200 });
  },
};
```

`workers/license-fulfillment/wrangler.toml`:
```toml
name = "license-fulfillment"
main = "src/index.ts"
compatibility_date = "2026-07-01"

# kv_namespaces filled in during Task 12 (wrangler kv namespace create ORDERS)
# [[kv_namespaces]]
# binding = "ORDERS"
# id = "<filled by wrangler>"

[vars]
EMAIL_FROM = "Sealshot <license@mail.seal-shot.com>"
# Secrets (SIGNING_KEY_B64, POLAR_WEBHOOK_SECRET, RESEND_API_KEY) set via `wrangler secret put`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- handler`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the whole Worker suite**

Run: `npm test`
Expected: PASS (all modules).

- [ ] **Step 6: Commit**

```bash
git add workers/license-fulfillment/src/index.ts workers/license-fulfillment/wrangler.toml workers/license-fulfillment/tests/handler.test.ts
git commit -m "feat(worker): wire webhook → issue → email → store with idempotency"
```

---

### Task 10: Promo config + active-promo selection (website)

**Files:**
- Create: `src/config/promos.ts`
- Create: `tests/promos.test.ts`, `vitest.config.ts` (repo root)
- Modify: `package.json` (add `vitest` devDep + `test` script)

**Interfaces:**
- Produces:
  - `REGULAR_PRICE_CENTS = 2999`, `BASE_CHECKOUT_URL: string`
  - `type Promo = { id: string; label: string; polarCheckoutUrl: string; priceCents: number; startsAt: string; endsAt: string }`
  - `PROMOS: Promo[]`
  - `activePromo(now: Date): Promo | null`
  - `formatUSD(cents: number): string`

- [ ] **Step 1: Add vitest to the site**

Modify `package.json` — add to `scripts`: `"test": "vitest run"`; add to `devDependencies`: `"vitest": "^2.0.0"`.

Create `vitest.config.ts` (repo root):
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] **Step 2: Write the failing test**

`tests/promos.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { activePromo, formatUSD, REGULAR_PRICE_CENTS } from '../src/config/promos';

describe('activePromo', () => {
  it('returns the launch promo inside its window', () => {
    const p = activePromo(new Date('2026-08-01T00:00:00Z'));
    expect(p?.id).toBe('launch-2026');
    expect(p?.priceCents).toBe(1499);
  });
  it('returns null before the window', () => {
    expect(activePromo(new Date('2026-01-01T00:00:00Z'))).toBeNull();
  });
  it('returns null after the window (endsAt exclusive)', () => {
    expect(activePromo(new Date('2030-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('formatUSD', () => {
  it('formats cents', () => {
    expect(formatUSD(2999)).toBe('$29.99');
    expect(formatUSD(1499)).toBe('$14.99');
  });
});

describe('constants', () => {
  it('regular price is $29.99', () => {
    expect(REGULAR_PRICE_CENTS).toBe(2999);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm install && npm test -- promos`
Expected: FAIL — cannot find module `../src/config/promos`.

- [ ] **Step 4: Implement**

`src/config/promos.ts`:
```ts
export const REGULAR_PRICE_CENTS = 2999;

// Base Polar checkout link (no discount). Replace <...> with the real product link in Task 12.
export const BASE_CHECKOUT_URL = 'https://buy.polar.sh/<product-checkout-id>';

export type Promo = {
  id: string;
  label: string;
  polarCheckoutUrl: string; // Polar checkout link with the discount pre-applied
  priceCents: number;       // DISPLAY only — Polar is authoritative on the charge
  startsAt: string;         // ISO 8601
  endsAt: string;           // ISO 8601, exclusive
};

// Add future promos by appending entries + creating the matching Polar discount.
export const PROMOS: Promo[] = [
  {
    id: 'launch-2026',
    label: 'Launch price',
    polarCheckoutUrl: 'https://buy.polar.sh/<product-checkout-id>?discount_code=LAUNCH',
    priceCents: 1499,
    startsAt: '2026-07-20T00:00:00Z',
    endsAt: '2026-09-01T00:00:00Z',
  },
];

/** The single active promo (first whose window contains `now`), or null. */
export function activePromo(now: Date): Promo | null {
  const t = now.getTime();
  return (
    PROMOS.find((p) => t >= Date.parse(p.startsAt) && t < Date.parse(p.endsAt)) ?? null
  );
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- promos`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/config/promos.ts tests/promos.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(site): reusable promo config + active-promo selection"
```

---

### Task 11: `/buy` page (website)

**Files:**
- Create: `src/pages/buy.astro`

**Interfaces:**
- Consumes: `activePromo`, `formatUSD`, `REGULAR_PRICE_CENTS`, `BASE_CHECKOUT_URL` (Task 10); `SiteLayout` (existing)

The page renders price with promo treatment, a "what you get" list, trust reassurance, and a Buy button pointing at the active promo's checkout URL (or the base URL). Promo selection runs at build time via `activePromo(new Date())`.

- [ ] **Step 1: Implement the page**

`src/pages/buy.astro`:
```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
import { activePromo, formatUSD, REGULAR_PRICE_CENTS, BASE_CHECKOUT_URL } from '../config/promos';

const promo = activePromo(new Date());
const checkoutUrl = promo?.polarCheckoutUrl ?? BASE_CHECKOUT_URL;
const priceCents = promo?.priceCents ?? REGULAR_PRICE_CENTS;
---

<SiteLayout
  title="Buy Sealshot"
  description="Buy Sealshot for Mac — a one-time purchase with 12 months of updates. Signed, notarized, on-device only."
>
  <section class="hero">
    <div class="wrap">
      <p class="kicker">Buy Sealshot</p>
      <h1>One purchase. Yours to keep.</h1>

      <p class="price">
        {promo && <span class="was">{formatUSD(REGULAR_PRICE_CENTS)}</span>}
        <span class="now">{formatUSD(priceCents)}</span>
        {promo && <span class="badge">{promo.label}</span>}
      </p>

      <div class="actions">
        <a class="button" href={checkoutUrl}>Buy Sealshot — {formatUSD(priceCents)}</a>
      </div>

      <ul class="whatyouget">
        <li>Perpetual license — the app never stops working.</li>
        <li>12 months of updates included.</li>
        <li>14-day free trial, no account required.</li>
        <li>Signed &amp; notarized. On-device only — your screenshots never leave your Mac.</li>
        <li>macOS 14 or later · Apple Silicon &amp; Intel.</li>
      </ul>

      <p class="fine-print">
        Delivered instantly by email as a license file. Prices in USD; tax handled at checkout.
        Already bought? Your license arrived in your purchase email — open it or drag it onto
        Settings ▸ License.
      </p>
    </div>
  </section>
</SiteLayout>

<style>
  .price { font-size: 2rem; display: flex; align-items: baseline; gap: .6rem; flex-wrap: wrap; }
  .price .was { text-decoration: line-through; opacity: .55; font-size: 1.3rem; }
  .price .now { font-weight: 700; }
  .price .badge {
    font-size: .8rem; font-weight: 600; padding: .15rem .5rem; border-radius: 999px;
    background: var(--sl-color-accent-low, #e7f0ff); color: var(--sl-color-accent-high, #14396b);
  }
  .whatyouget { margin: 1.5rem 0; line-height: 1.9; }
</style>
```

- [ ] **Step 2: Build the site to verify the page compiles**

Run: `npm run build`
Expected: Build succeeds; `dist/buy/index.html` exists and shows the launch price `$14.99` with a struck-through `$29.99` (given the current date is within the launch window).

- [ ] **Step 3: Commit**

```bash
git add src/pages/buy.astro
git commit -m "feat(site): /buy page driven by promo config"
```

---

### Task 12: Deploy + secrets + one-time Swift→TS parity cross-check (manual)

**Files:**
- Create: `scripts/export-signing-key.swift`
- Modify: `workers/license-fulfillment/wrangler.toml` (uncomment KV binding with the real id)

This task is operational, not TDD. Each step is a manual action with a verification.

- [ ] **Step 1: Export the signing key from the Keychain**

Create `scripts/export-signing-key.swift`:
```swift
import Foundation
import Security
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: "com.seal-shot.licensegen",
    kSecAttrAccount as String: "primary",
    kSecReturnData as String: true,
]
var out: CFTypeRef?
guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess, let data = out as? Data else {
    FileHandle.standardError.write(Data("no key found\n".utf8)); exit(1)
}
print(data.base64EncodedString())
```
Run: `swift scripts/export-signing-key.swift`
Expected: prints a base64 string (the 32-byte raw private key). Verify it decodes to 32 bytes:
`swift scripts/export-signing-key.swift | base64 -d | wc -c` → `32`.

- [ ] **Step 2: Create KV + set secrets**

```bash
cd workers/license-fulfillment
npx wrangler kv namespace create ORDERS   # copy the id into wrangler.toml (uncomment the block)
npx wrangler secret put SIGNING_KEY_B64   # paste output of Step 1
npx wrangler secret put POLAR_WEBHOOK_SECRET  # from Polar dashboard (whsec_...)
npx wrangler secret put RESEND_API_KEY     # from Resend
```

- [ ] **Step 3: Deploy the Worker**

Run: `npx wrangler deploy`
Expected: prints the Worker URL, e.g. `https://license-fulfillment.<subdomain>.workers.dev`.

- [ ] **Step 4: Configure Polar**

In Polar: create the product ($29.99 one-time) and a `LAUNCH` discount ($14.99); set the webhook endpoint to `<worker-url>/webhooks/polar` subscribed to `order.paid`; copy the product checkout link + discounted link into `src/config/promos.ts` (`BASE_CHECKOUT_URL`, `PROMOS[0].polarCheckoutUrl`) and commit.

- [ ] **Step 5: Verify Resend domain**

In Resend: verify `mail.seal-shot.com` (DNS records) so `EMAIL_FROM` can send. Send a Resend test email to confirm.

- [ ] **Step 6: Live end-to-end + Swift parity cross-check**

Make a real (or Polar test-mode) purchase. Confirm the email arrives with a `.sealshotlicense` attachment. Then prove Swift accepts the Worker-issued file:
```bash
cd /Users/ledeng/projects/sealshot/scripts/licensegen
swift run licensegen verify /path/to/downloaded-worker-license.sealshotlicense
```
Expected: `VALID — <name> <<email>> updates through <date>`. Also activate it in the app (Settings ▸ License) and confirm it unlocks. **This is the definitive parity gate: a Worker-signed license accepted by the shipping app.**

- [ ] **Step 7: Commit config**

```bash
git add scripts/export-signing-key.swift workers/license-fulfillment/wrangler.toml src/config/promos.ts
git commit -m "chore: deploy config + real Polar checkout links + key export script"
```

---

## Self-Review

**Spec coverage:**
- `/buy` page → Task 11 ✓
- Promo system (general/reusable) → Task 10 ✓
- Cloudflare Worker fulfillment → Tasks 1–9 ✓
- License format parity (TS port) → Tasks 2–5 (+ live gate in Task 12) ✓
- Polar webhook signature verify → Task 6 ✓
- Idempotency → Tasks 7, 9 ✓
- Resend email delivery → Task 8 ✓
- Error/retry semantics (401 bad sig, 500 → Polar retries, `pending` state) → Task 9 ✓
- Secrets in Worker only → Task 12 ✓
- Deferred items (renewals, multi-seat, self-serve resend) → correctly absent ✓

**Placeholder scan:** The only intentional placeholders are the real-world identifiers filled during Task 12 (`<product-checkout-id>`, KV id, deployed URL) — these are external values that cannot exist until the accounts are provisioned, and each has an explicit step to fill it. No code-logic placeholders remain.

**Type consistency:** `issueLicense`/`LicenseInput`, `verifyLicenseFile`/`VerifyResult`, `OrderRecord`, `parseOrderPaid` return shape, and `Env` are used consistently across Tasks 4–9. `addMonthsUTC` defined in Task 4, consumed in Task 9. Promo types (Task 10) consumed in Task 11.

**Known risk:** Polar's exact webhook header names / payload shape (Task 6) must be confirmed against current Polar docs at implementation time; the test pins the Standard Webhooks algorithm, but field paths (`data.customer.email` etc.) may need adjusting to match the real `order.paid` payload.
