---
title: FAQ
description: Frequently asked questions about Sealshot.
---

## Does Sealshot send my screenshots anywhere?

No. Capture, OCR, metadata generation, and search all run on your Mac.
Nothing is uploaded, there is no account, and there is no telemetry. See the
[privacy policy](/privacy/) for the full picture.

## What does Sealshot run on?

macOS 14 (Sonoma) or later, as a universal binary for Apple Silicon and
Intel.

## How do I update Sealshot?

Direct downloads update themselves via Sparkle — you'll be offered new
versions automatically. Every release is also published on
[GitHub](https://github.com/raydeng83/Sealshot-Release/releases).

## Why does Sealshot need Screen Recording permission?

macOS requires it for any app that captures the screen. Sealshot uses it
only when you take a capture, and the pixels never leave your device.

## What is a .seal file?

Sealshot's native format: your original pixels plus annotations in one
editable package. See [The .seal format](/docs/guide/seal-format/).

## Can Sealshot automatically detect API keys and faces?

Not yet — Smart Redaction (automatic flagging of API keys, PII, and faces)
is the headline roadmap feature. Today you redact manually with the
[blur tools](/docs/guide/editor/#blur-and-redaction).

## I found a bug / I want a feature

We want to hear it — use the [feedback form](/support/).
