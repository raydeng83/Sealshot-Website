---
title: Smart Redaction
description: Automatic on-device detection of sensitive text in your captures.
---

Smart Redaction scans a capture for sensitive content and proposes
redactions for you to review. All detection runs **on your Mac** — nothing
is sent anywhere.

## What it detects

The built-in detectors (always available) look for:

- **Contact details** — email addresses, phone numbers, mailing addresses.
- **Financial data** — credit-card numbers (Luhn-validated, plus cardholder
  name and expiry), IBANs, bank routing numbers, crypto wallet addresses,
  and money amounts on financial documents.
- **Identity** — Social Security numbers and passport machine-readable
  zones (MRZ).
- **Recovery secrets** — 2FA backup codes and recovery-code grids.
- **API keys & tokens** — AWS, Stripe, GitHub, GitLab, Google, Slack,
  OpenAI, Anthropic, SendGrid, and Twilio keys; JWTs and `Bearer` tokens;
  private keys; URLs with embedded credentials; and other high-entropy
  secrets.
- **Names, organizations, and locations**, plus labeled sensitive fields
  ("Account number: …").

### The enhanced on-device model

For detection by *meaning* rather than pattern, Sealshot offers an
**enhanced on-device redaction model** (~400 MB, Apple Silicon). The first
time it would help, Sealshot asks before downloading — decline and the
built-in detectors keep working. The model is document-aware: it recognizes
what a financial statement or an ID card is, and applies detection tuned to
it. Manage it (download or remove) in **Settings → On-Device AI**.

On **macOS 26 with Apple Intelligence**, an optional **Thorough scan**
toggle adds a final Apple Intelligence pass to catch sensitive items the
detectors miss — slower, but more complete.

:::note
Smart Redaction detects sensitive **text** (read from the image with
on-device OCR). It does not detect faces or other imagery — use the
[blur tool](/docs/guide/editor/#blur-and-redaction) for those.
:::

## Running a scan

- **On demand** — click the **Smart Redact** button in the editor toolbar.
  If nothing sensitive is found, the button briefly shows *Nothing found*.
  When a [focus region](/docs/guide/editor/#crop-and-resize) is set, the
  scan covers just that region.
- **Automatically** — turn on **Scan captures automatically** in
  **Settings → On-Device AI → Smart Redaction** (off by default) and every
  capture is scanned as it opens.

![The Smart Redaction settings](/manual/redaction-setting.png)
*Automatic scanning, the enhanced model, and Thorough scan live in
Settings → On-Device AI.*

## Reviewing and applying

A scan opens the **Smart Redaction** panel listing everything found. Each
row leads with the flagged text (masked — only the first and last few
characters), plus its **category** and why it was flagged.

**High-risk items start checked** — card numbers, keys and tokens, IDs,
emails, phones, addresses. Lower-confidence finds (names, organizations,
locations) start unchecked so you stay in control. **Select all** /
**Deselect all** flip the whole list, and hovering a row spotlights the
matching region on the capture. Then press **Apply**; **Cancel** dismisses
the panel without changing anything.

![The redaction review panel](/manual/redaction-review.png)
*High-risk items pre-checked; hover a row to see where it is.*

Applied items are covered with a **solid fill**, so the text underneath is
unrecoverable in the exported image. They're added as regular blur
annotations in one undo step, so a single **⌘Z** removes them all, and you
can select, move, or delete any of them afterward like other annotations.

## Redacting manually

For anything Smart Redaction doesn't catch — faces, logos, handwriting,
images — paint over it with the [blur tool](/docs/guide/editor/#blur-and-redaction)
using **Solid fill** for unrecoverable coverage.
