---
title: "Share sensitive captures safely"
description: Document-aware redaction, encryption at rest, and an encrypted package with a passcode and expiry.
---

Bank statements, IDs, medical paperwork, contracts — sometimes you have
to capture and share them anyway. This workflow keeps a document
protected at every step: detected, redacted, encrypted at rest, and
encrypted in transit.

This is the page the other workflows point to. Whenever a capture is
about to leave your Mac and something on it shouldn't, these are the
steps.

## Set up once

Turn on [Enhanced Security](/docs/guide/security/). The un-redacted
originals then sit encrypted on disk (AES-256-GCM), viewable only after
Touch ID, and auto-lock takes over when you step away — capturing still
works while locked.

Redaction uses the
[enhanced on-device model](/docs/guide/redaction/#the-enhanced-on-device-model),
which recognizes *what kind* of document it's looking at and tunes
detection accordingly.

## The steps

*[Capture](/docs/workflows/#1-capture) →
[Encrypt](/docs/workflows/#2-encrypt-optional) →
[Refine](/docs/workflows/#3-refine) → [Deliver](/docs/workflows/#5-deliver)*

1. **Capture** — the document, with **⌘⇧C**, or a
   [scrolling capture](/docs/guide/capture/#scrolling-capture) (**⌘⇧W**)
   for a long statement.

2. **Encrypt** — already handled. The un-redacted original is encrypted
   the moment it's stored, viewable only after Touch ID, and auto-lock
   takes over if you step away. There's nothing to do at this step; it's
   the setting above doing its job, which is the point of turning it on
   once.

3. **Refine** — let document-aware redaction read it. Run **Smart Redact**.
   Sealshot flags account and card numbers, SSNs, passport MRZ lines,
   addresses, and money amounts on financial documents. High-risk items
   start pre-checked —
   [review the list](/docs/guide/redaction/#reviewing-and-applying) and
   Apply. Anything the scan missed, cover
   [manually](/docs/guide/redaction/#redacting-manually).

   ![The redaction review panel over a capture full of secrets](/manual/redaction-review.png)

   The redacted result is what leaves. The original stays sealed.

4. **Deliver** — select the capture and press **⇧⌘E**.
   [Export to Package](/docs/guide/sharing/) generates a strong passcode
   (copy it before export unlocks), takes an optional expiry date and
   hint, and writes a `.sealshare` that only Sealshot plus the passcode
   can open. **Send the passcode separately** — package by email, passcode
   by Signal or a phone call, never the same channel. Otherwise one
   intercepted inbox gets both halves.

   ![The Export to Package dialog](/manual/export-package.png)

## Combine with

Any other workflow — this is the sensitive path through
[Explain](/docs/workflows/explain/),
[Demonstrate](/docs/workflows/demonstrate/), and
[Extract](/docs/workflows/extract/).

## Examples

[Send an ID or bank
statement](/docs/workflows/recipes/#send-an-id-or-bank-statement) ·
[Contract markup for
review](/docs/workflows/recipes/#contract-markup-for-review)

:::caution
The exported package contains the **redacted** result unless you
deliberately enable *Include original un-redacted capture*. Leave that
off unless the recipient genuinely needs the original.
:::
