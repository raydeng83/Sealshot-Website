---
title: FAQ
description: Frequently asked questions about Sealshot.
---

## Does Sealshot send my screenshots anywhere?

No. Capture, recording, OCR, redaction, AI metadata, and search all run on
your Mac. Nothing you capture is ever uploaded, there is no account, and
there is no telemetry. Sealshot's only network activity is checking for app
updates and — only if you approve it — downloading the optional
[enhanced redaction model](/docs/guide/redaction/#the-enhanced-on-device-model).
Both are downloads; your content never goes the other way. See the
[privacy policy](/privacy/) for the full picture.

## What does Sealshot run on?

macOS 14 (Sonoma) or later, as a universal binary for Apple Silicon and
Intel. Some [on-device AI](/docs/guide/ai/) extras use Apple Intelligence,
which needs macOS 26 on Apple Silicon — on other Macs those features fall
back to built-in on-device processing.

## Can Sealshot record video?

Yes — the full screen, a window, or a region, with system audio and
microphone, paused and resumed from a floating HUD. See
[Screen recording](/docs/guide/recording/).

## How do I update Sealshot?

Direct downloads update themselves via Sparkle — you'll be offered new
versions automatically. Every release is also published on
[GitHub](https://github.com/raydeng83/Sealshot-Release/releases).

## Why does Sealshot need Screen Recording permission?

macOS requires it for any app that captures the screen. Sealshot uses it
only when you take a capture or recording, and the pixels never leave your
device. Microphone permission is only requested if you record your voice;
Accessibility only if you use auto-scroll.

## What is a .seal file?

Sealshot's native format: your original pixels (or video) plus annotations
and metadata in one editable package. See
[The .seal format](/docs/guide/seal-format/).

## Can Sealshot automatically detect sensitive information?

Yes. [Smart Redaction](/docs/guide/redaction/) scans captures on your Mac —
on demand, or automatically if you enable it — for emails, phone numbers,
addresses, card numbers, IDs (SSNs, passport MRZ), and API keys/tokens, and
proposes redactions for you to review. An optional on-device model extends
detection to sensitive content by meaning. It detects sensitive **text**,
not faces — use the [blur tool](/docs/guide/editor/#blur-and-redaction) for
faces, logos, and other imagery.

## How do I share a capture securely?

Export it as an encrypted `.sealshare` package with a generated passcode —
see [Sharing & export](/docs/guide/sharing/).

## Do my edits and undo history survive a relaunch?

Yes. The editor's undo/redo history is persistent across switching captures
and relaunching, and so is undo/redo for deleting and restoring captures.

## Is my library encrypted?

It can be. Turn on [Enhanced Security](/docs/guide/security/) to encrypt
your captures, recordings, search index, and OCR text at rest and lock
viewing behind Touch ID.

## I found a bug / I want a feature

We want to hear it — use the [feedback form](/support/).
