# Purchase & Delivery — Design

**Date:** 2026-07-20
**Status:** Approved, ready for implementation plan
**Scope:** Add a paid purchase flow and automated license delivery to the Sealshot marketing site.

## Background

The Sealshot **Direct** edition now has an offline licensing system (the **MAS** edition stays
entitled via the App Store and is out of scope). A license is a cryptographically-signed,
clear-text `.sealshotlicense` file — **no account, no server activation, no online check-in**.
The app verifies it fully offline against an embedded Ed25519 public key.

Commercial model (already implied by the app): **one-time perpetual purchase + 12 months of
updates**. The license is perpetual; `updatesThrough` (purchase + 12 months) limits only which
*app updates* may install, never the app itself. There is a 14-day free trial; on expiry,
content *creation* is gated but all existing data stays viewable/editable/exportable.

Today licenses are minted by hand with the Swift `licensegen` CLI
(`scripts/licensegen/` in the app repo), signed with an Ed25519 private key that lives only in
the founder's login Keychain. The app already hard-codes a buy URL — `https://www.seal-shot.com/buy`
— and expects the signed license file to arrive **by email**.

**The gap:** the purchase → payment → license-file generation → delivery pipeline does not exist.
This spec closes that gap.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Fulfillment | Fully automated, instant delivery |
| Payment provider | **Polar** (Merchant of Record — collects/remits VAT/sales tax) |
| Seller | User's business entity |
| Regular price | **$29.99** (one-time) |
| Launch promo | **$14.99** |
| Promo model | General, reusable promo system (launch is the first entry) |
| License signing | **TypeScript port** of the signing logic in a Cloudflare Worker, using the same Ed25519 private key |
| Signing key location | Encrypted Cloudflare Worker secret (accepted trade-off of automation) |
| Transactional email | **Resend** (carries the license file; Polar sends its own receipt) |
| Single-seat only | `seats = 1` (unenforced in-app; multi-seat deferred) |

### Deferred (explicitly NOT in v1)
- **Renewals** — the update window is 12 months; no customer can need a renewal for a year. The
  app's "Renew License…" button points at `/buy` for now.
- **Multi-seat / team purchases.**
- **Self-serve "lost my license, resend it" page** — re-delivery is manual at launch volume
  (existing lockout runbook), using the stored order→license record.

## Architecture

Three cleanly separated pieces:

```
[ /buy page (Astro, static) ]  →  [ Polar hosted checkout ]  →  order.paid webhook
                                                                        ↓
                                              [ Cloudflare Worker: license-fulfillment ]
                                                    ├─ verify Polar webhook signature
                                                    ├─ sign .sealshotlicense (Ed25519)
                                                    ├─ email file via Resend
                                                    └─ store order→license record (KV/D1)
```

- **`/buy` page** — static Astro page on the existing site. Renders price/badge/checkout-link from
  a promo config. Holds **no secrets**.
- **`license-fulfillment` Worker** — a new, separately-deployed Cloudflare Worker. The **only** place
  secrets live: Ed25519 private key, Polar webhook secret, Resend API key.
- **Polar** — hosted checkout + merchant of record + webhook source; also sends the payment receipt.

## Component 1 — `/buy` page (website)

New Astro page at `src/pages/buy.astro`, matching existing site styling (`SiteLayout`).

Content: headline, price (with promo treatment when active), "what you get" (perpetual license +
12 months of updates + 14-day trial reassurance / "your data is never hostage"), and a **Buy**
button that opens the Polar checkout link. Reassure: signed & notarized, on-device only, macOS 14+.

The app deep-links here from trial/expiry gates and "Buy Sealshot…" / "Renew License…", so the page
must stand alone and load fast.

## Component 2 — Promo system (website)

Typed config at `src/config/promos.ts`:

```ts
type Promo = {
  id: string;               // "launch-2026"
  label: string;            // "Launch price" — shown as badge
  polarCheckoutUrl: string; // Polar checkout link with the discount pre-applied
  priceCents: number;       // 1499 — DISPLAY only
  startsAt: string;         // ISO 8601
  endsAt: string;           // ISO 8601
};

const REGULAR_PRICE_CENTS = 2999;
```

- The `/buy` page selects the **active** promo by date window (`startsAt <= now < endsAt`).
- Active promo → strikethrough `$29.99`, promo price, badge, and Buy → `polarCheckoutUrl`.
- No active promo → full price, base checkout link.
- Each promo maps to a **Polar discount** (pre-applied via the checkout link). Adding a promo later
  = create a Polar discount + add one config entry. No code surgery.

**Trust boundary:** the config controls **display and which checkout link only**. Polar is
authoritative on the amount actually charged; the Worker reads the real paid amount from the webhook.
The client is never trusted for pricing.

## Component 3 — `license-fulfillment` Worker

Endpoint: `POST /webhooks/polar` (Polar → Worker).

**Flow for `order.paid`:**
1. **Verify the Polar webhook signature.** Reject unsigned/tampered/replayed events → `401`.
2. Extract `name`, `email`, `order_id`, `paid_at` from the payload.
3. **Idempotency check:** look up `order_id` in the store. If a license already exists, re-send that
   *same* license (never mint a second one).
4. **Generate the license** — a TypeScript port producing a byte-for-byte compatible
   `.sealshotlicense`:
   - Payload: `id` (UUID), `name`, `email`, `edition = "pro"`, `issued = paid_at`,
     `updatesThrough = paid_at + 12 months` (`yyyy-MM-dd`), `seats = 1`.
   - Sign the canonical JSON payload bytes with Ed25519 (same private key as `licensegen`).
   - Emit the human-readable preamble + `SEALSHOT1.<base64 envelope>`, with the preamble
     `textHash = base64(SHA256(canonicalized preamble))` bound into the payload — matching
     `LicenseFormat.swift` exactly.
5. **Email** the `.sealshotlicense` as an attachment via Resend, with activation instructions
   ("Open the file from this email, or drag it onto the License settings window").
6. **Persist** `order_id → { license_id, email, issued, state }` (KV or D1) for idempotency and
   manual resend/support.

### License format parity (critical)
The Worker's output must verify identically to `licensegen` output against the app's
`LicenseVerifier`. Source of truth for the format: `LicenseFormat.swift`, `LicenseVerifier.swift`,
`LicenseKeys.swift` in the app repo. Key details to replicate exactly:
- Ed25519 (Curve25519) signature over the **raw JSON bytes** of the canonicalized `LicensePayload`.
- Preamble canonicalization + SHA256 `textHash`, bound into the payload (editing the preamble must
  invalidate the license — `LicenseError.textTampered`).
- `SEALSHOT1.` envelope prefix; base64 of the `SignedLicense` envelope.
- Field names, order, and date formats identical to the Swift encoder.

### Secrets (Worker only)
- `ED25519_PRIVATE_KEY` — same key `licensegen` uses (must match an embedded public key).
- `POLAR_WEBHOOK_SECRET`.
- `RESEND_API_KEY`.

## Error handling

| Failure | Behavior |
|---------|----------|
| Bad / replayed webhook signature | `401`, no license issued |
| Signing or email failure | Non-2xx → **Polar auto-retries** the webhook; store marks state `pending`; retries are idempotent |
| Persistent email failure | Order recorded `pending` for manual follow-up; `licensegen` remains the manual fallback |
| Customer never receives email | v1: manual resend from the stored record (self-serve resend deferred to phase 2) |

## Testing

- **License parity (critical):** a Worker-signed license and a `licensegen`-signed license both
  pass the app's verification against the embedded public key. Cross-check the Worker output with
  the Swift `licensegen verify` and/or the app's `LicenseVerifier`.
- Webhook signature verification: valid / invalid / replayed.
- Idempotency: same `order_id` twice → exactly one license, same file re-sent.
- Promo config: active-window selection; no-active-promo fallback; boundary dates.
- Email delivery via Resend sandbox (attachment present, correct filename `<email>.sealshotlicense`).

## Out of scope / non-goals
- MAS (Mac App Store) edition — always entitled via the App Store.
- Device/seat enforcement — unenforced in-app by design.
- Renewals, multi-seat, self-serve resend page (all deferred).
- Changing the app's licensing/verification code — the Worker conforms to the existing format.

## Key references (app repo: `/Users/ledeng/projects/sealshot`)
- `app/Sources/Sealshot/Licensing/LicenseFormat.swift` — payload + preamble + envelope format
- `app/Sources/Sealshot/Licensing/LicenseVerifier.swift` — verification the Worker must satisfy
- `app/Sources/Sealshot/Licensing/LicenseKeys.swift` — embedded public keys + `LicensingConfig` (buy URL, blocklist)
- `app/Sources/Sealshot/Licensing/EntitlementStore.swift` — entitlement state machine, update window
- `scripts/licensegen/Sources/licensegen/main.swift` — the CLI the Worker ports (`issue`)
- `docs/support/lockout-runbook.md` — manual verification / resend flow
