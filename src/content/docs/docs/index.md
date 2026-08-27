---
title: Welcome to Sealshot
description: What Sealshot is, the ideas behind it, and where to start.
---

Sealshot is a screenshot and screen-recording studio for the Mac. Capture
any part of the screen — or a whole scrolling page, or video — annotate
and redact it, then organize, search, and share the result. Everything
happens on your Mac: no account to create, no cloud between you and your
work, no telemetry.

![A capture open in the Sealshot editor](/manual/editor-overview.jpg)
*The editor — one of the five parts of the app mapped in
[the Quickstart](/docs/quickstart/parts/).*

## The ideas behind it

### Private by architecture

Screenshots are the most casually sensitive files on a computer — they
capture whatever happened to be on screen, credentials and all. So
Sealshot processes everything locally: capture, recording, OCR, search,
AI metadata, redaction. Its only network activity is three downloads — the
update check, a public list of revoked licenses, and an optional model download
you approve first. See
[Security & privacy](/docs/guide/security/) and the
[privacy policy](/privacy/).

### Your work stays editable

Captures are saved as [`.seal` packages](/docs/guide/seal-format/): the
original pixels (or video) plus your annotations and metadata, in one
file. Reopen a capture next month and every arrow, blur, and text box is
still an object you can move or delete — nothing is ever flattened unless
you export it that way.

### Sensitive content is a first-class problem

Most screenshot tools leave privacy to your vigilance. Sealshot has
machinery for it: [Smart Redaction](/docs/guide/redaction/) finds emails,
card numbers, API keys, and other sensitive text and proposes redactions
for you to review; [Enhanced Security](/docs/guide/security/) encrypts
your library at rest behind Touch ID; and
[`.sealshare` export](/docs/guide/sharing/) wraps captures in an
encrypted, passcode-protected package for sending.

### Yours to keep

Sealshot is **free to use** — every feature, no account, no card, nothing
that expires. It is donation-supported: [give any amount](/donate/) and a
supporter license arrives that covers every future update and turns off the
app's occasional reminder. The
license file activates entirely offline — no account, no activation server, and
[nothing to renew](/docs/faq/#buying--licensing).

## What you can do with it

- **[Capture](/docs/guide/capture/)** a region, window, or display —
  including scrolling pages and multi-monitor setups.
- **[Record](/docs/guide/recording/)** the screen with system audio and
  microphone, controlled from a floating HUD.
- **[Annotate & edit](/docs/guide/editor/)** with arrows, shapes, styled
  text, blur, focus effects, crop, and resize — all undoable, all
  persistent.
- **[Redact](/docs/guide/redaction/)** sensitive text automatically, with
  every proposal reviewed by you before it burns in.
- **[Organize & find](/docs/guide/library/)** everything in a searchable
  library — OCR'd text, [AI titles, summaries, and tags](/docs/guide/ai/)
  included, all generated on-device.
- **[Share](/docs/guide/sharing/)** as a flat PNG or movie for anywhere,
  or as an encrypted package when it matters who can open it.

## What it runs on

macOS 14 (Sonoma) or later, on Apple Silicon and Intel alike. A few
on-device AI extras need newer hardware — see
[Which Macs run what](/docs/guide/ai/#which-macs-run-what).

## Where to go next

- **New here?** Start with the [Quickstart](/docs/quickstart/install/) — install, the parts of the app, and your first capture.
- **Have a job to do?** Pick a [workflow](/docs/workflows/) by what you're
  trying to accomplish — [explain](/docs/workflows/explain/),
  [publish](/docs/workflows/publish/),
  [demonstrate](/docs/workflows/demonstrate/),
  [protect & share](/docs/workflows/protect-and-share/), or
  [extract](/docs/workflows/extract/) — or find your exact job in the
  [examples](/docs/workflows/recipes/).
- **Want to go faster?** Skim the [Tips & tricks](/docs/tips/).
- **Stuck?** Check the [FAQ](/docs/faq/) or [send us feedback](/support/).
- **What's new?** See the [changelog](/docs/changelog/v0-7-3/).
