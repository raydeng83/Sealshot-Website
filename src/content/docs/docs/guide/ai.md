---
title: On-device AI
description: Automatic titles, summaries, and keywords, plus structured-data extraction — all on your Mac.
---

Sealshot uses on-device AI to make captures self-describing and their
contents reusable. Like everything else in Sealshot, it runs **entirely on
your Mac** — on Macs with Apple Intelligence it uses Apple's on-device
models; elsewhere it falls back to built-in rule-based processing. Nothing
is sent anywhere.

## Automatic titles, summaries, and Smart Keywords

When a capture or recording lands in your library, Sealshot generates a
**title**, a short **summary**, and **Smart Keywords** from what's visible —
plus visual tags for things like QR codes and documents. They appear in the
editor's **Info panel**, where the summary is yours to edit (with a *Revert
to Generated Summary* if you change your mind).

Smart Keywords are kept separate from your own
[tags](/docs/guide/library/#titles-tags-and-the-info-panel): generated ones
are read-only and refresh over time; your tags are always yours. Search
matches both.

## Extract Structured Data

The **Extract Structured Data** pill in the editor toolbar (also in the
canvas right-click menu) reads the capture and pulls out its *structure*:
tables, form fields, contacts, URLs, emails, phone numbers, addresses,
amounts, dates — even stack traces.

Results open in an **Extracted Data** window as cleanly formatted text —
tables become real Markdown tables — with **Copy**, **Export…** (saved
under the capture's name), and **Re-extract** buttons. The result is cached
in the capture's `.seal` package, so it's instant next time.

When the [enhanced on-device model](/docs/guide/redaction/#the-enhanced-on-device-model)
is downloaded, extraction uses it too, recognizing entities by meaning
rather than pattern.

![The Extracted Data window](/manual/extract-data.png)
*A screenshot's tables and fields, extracted into clean, copyable text.*

## Smarter search

On Apple Intelligence Macs, library search quietly expands your query with
related terms — searching "invoice" can also surface captures matching
"receipt" or "billing". See
[Library & search](/docs/guide/library/#search).

## Controlling it

Everything lives in **Settings → On-Device AI**:

- **Use on-device AI** (on by default) — the master switch for automatic
  metadata, Smart Keywords, and AI-assisted redaction and search. Turn it
  off and Sealshot stops generating; OCR and plain search keep working.
- The **Smart Redaction** options, including the optional enhanced model and
  Thorough scan, are here too — see
  [Smart Redaction](/docs/guide/redaction/).

## Which Macs run what

Sealshot is a universal binary, and every feature has an on-device path —
but the AI extras scale with your hardware:

| Feature | Intel | Apple Silicon | Apple Silicon + macOS 26 (Apple Intelligence) |
| --- | --- | --- | --- |
| OCR, Live Text, full-text search | ✓ | ✓ | ✓ |
| Smart Redaction (built-in detectors) | ✓ | ✓ | ✓ |
| Extract Structured Data | ✓ | ✓ | ✓ |
| Titles & keywords | built-in fallback | built-in fallback | Apple Intelligence |
| [Enhanced redaction model](/docs/guide/redaction/#the-enhanced-on-device-model) | — | ✓ (optional download) | ✓ (optional download) |
| Generated summaries, smarter search, Thorough scan | — | — | ✓ |

On an **Intel Mac**, everything core works — capture, recording, the
editor, OCR, search, rule-based redaction, and structured extraction — and
Sealshot generates titles and keywords with its built-in fallback. The
enhanced redaction model is Apple Silicon-only (Settings shows *"Requires a
Mac with Apple silicon"*), and the Apple Intelligence features additionally
need macOS 26 on Apple Intelligence-capable hardware.

Features degrade gracefully rather than disappearing — and whichever Mac
you're on, nothing ever leaves your machine.
