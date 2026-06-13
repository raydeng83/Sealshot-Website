---
title: Smart Redaction
description: Automatic on-device detection of sensitive text in your captures.
---

Smart Redaction scans a capture for sensitive text and proposes redactions
for you to review. All detection runs **on your Mac** — nothing is sent
anywhere.

## What it detects

Sealshot looks for:

- **Email addresses**
- **Phone numbers**
- **Credit-card numbers** (validated with the Luhn check to avoid false
  positives)
- **API keys & tokens** — AWS access keys, Stripe live keys, GitHub tokens
  and personal-access tokens, JWTs, and `Bearer` tokens, plus other
  high-entropy secrets

:::note
Smart Redaction detects sensitive **text** (read from the image with
on-device OCR). It does not detect faces or other imagery — use the
[blur tool](/docs/guide/editor/#blur-and-redaction) for those.
:::

## Running a scan

There are two ways to scan:

- **On demand** — click the **Smart Redact** button in the editor toolbar. If
  nothing sensitive is found, the button briefly shows *Nothing found*.
- **Automatically** — turn on **auto-scan** so every capture is scanned as it
  opens. Auto-scan is **off by default**; enable it in **Settings → General →
  Smart Redaction**.

![The Smart Redaction setting](/manual/redaction-setting.png)
*Turn on automatic scanning in Settings → General.*

## Reviewing and applying

A scan opens the **Smart Redaction** panel listing everything found, with a
count at the top. Each row shows the **category** (e.g. "Email address",
"Credit card", "AWS access key"), a **masked snippet** (only the first and
last few characters, never the full value), and a **confidence** score.

Every item starts **checked** — uncheck anything you'd rather leave visible —
then press **Apply**. **Cancel** dismisses the panel without changing
anything.

![The redaction review panel](/manual/redaction-review.png)
*Check the items to redact, then Apply. Snippets are masked.*

Applied items are covered with a **solid fill**, so the text underneath is
unrecoverable in the exported image. They're added as regular blur
annotations in one undo step, so a single **⌘Z** removes them all, and you can
select, move, or delete any of them afterward like other annotations.

## Redacting manually

For anything Smart Redaction doesn't catch — faces, logos, handwriting,
images — paint over it with the [blur tool](/docs/guide/editor/#blur-and-redaction)
using **Solid fill** for unrecoverable coverage.
