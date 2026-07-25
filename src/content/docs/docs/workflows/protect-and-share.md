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

## Use this when

- A bank statement, pay slip, or tax document
- An ID, passport, or insurance card
- Medical paperwork or a contract
- A screenshot carrying an account number, key, or token
- Any capture leaving your organization

## Set up once

Turn on [Enhanced Security](/docs/guide/security/). The un-redacted
originals then sit encrypted on disk (AES-256-GCM), viewable only after
Touch ID, and auto-lock takes over when you step away — capturing still
works while locked.

Redaction uses the
[enhanced on-device model](/docs/guide/redaction/#the-enhanced-on-device-model),
which recognizes *what kind* of document it's looking at and tunes
detection accordingly.

## The loop

1. **Capture the document** with **⌘⇧C**, or a
   [scrolling capture](/docs/guide/capture/#scrolling-capture) (**⌘⇧W**)
   for a long statement.

2. **Let document-aware redaction read it.** Run **Smart Redact**.
   Sealshot flags account and card numbers, SSNs, passport MRZ lines,
   addresses, and money amounts on financial documents. High-risk items
   start pre-checked —
   [review the list](/docs/guide/redaction/#reviewing-and-applying) and
   Apply. Anything the scan missed, cover
   [manually](/docs/guide/redaction/#redacting-manually).

   ![The redaction review panel over a capture full of secrets](/manual/redaction-review.png)

3. **Confirm the original stays sealed.** The redacted result is what
   leaves; the original stays encrypted behind Touch ID.

## Deliver

Select the capture and press **⇧⌘E** —
[Export to Package](/docs/guide/sharing/) generates a strong passcode
(copy it before export unlocks), takes an optional expiry date and hint,
and writes a `.sealshare` that only Sealshot plus the passcode can open.

**Send the passcode separately.** Package by email, passcode by Signal or
a phone call — never the same channel. Otherwise one intercepted inbox
gets both halves.

![The Export to Package dialog](/manual/export-package.png)

## Later

The recipient double-clicks the package, enters the passcode, and chooses
**Add to Library** or **Save to Folder…**. If you set an expiry, it stops
opening after that date without you having to chase it.

## Combine with

Any other workflow — this is the sensitive path through
[Explain](/docs/workflows/explain/),
[Demonstrate](/docs/workflows/demonstrate/), and
[Extract](/docs/workflows/extract/).

## Recipes

[Send an ID or bank
statement](/docs/workflows/recipes/#send-an-id-or-bank-statement) ·
[Contract markup for
review](/docs/workflows/recipes/#contract-markup-for-review)

:::caution
The exported package contains the **redacted** result unless you
deliberately enable *Include original un-redacted capture*. Leave that
off unless the recipient genuinely needs the original.
:::
