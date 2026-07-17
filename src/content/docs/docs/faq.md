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

## Does Sealshot work on Intel Macs?

Yes — capture, recording, the editor, OCR and search, Smart Redaction's
built-in detectors, and structured extraction all work the same on Intel.
Two extras need newer hardware: the enhanced redaction model (Apple
Silicon) and the Apple Intelligence features (macOS 26 on Apple Silicon).
See [Which Macs run what](/docs/guide/ai/#which-macs-run-what).

## Why does Sealshot offer to download a ~400 MB model?

That's the optional [enhanced redaction model](/docs/guide/redaction/#the-enhanced-on-device-model),
which recognizes sensitive content by meaning rather than pattern (and
improves structured extraction too). It downloads only after you approve
it, runs entirely on your Mac, and can be removed any time in **Settings →
On-Device AI**. Decline it and the built-in detectors keep working.

## Where are my captures stored?

In the folder set under **Settings → General → Storage** (default
`~/Pictures/Sealshot`), as [`.seal` packages](/docs/guide/seal-format/) —
captures and recordings alike. With
[Enhanced Security](/docs/guide/security/) on, they're encrypted at rest.

## Is Sealshot on the Mac App Store?

Not yet — today Sealshot ships as a signed, notarized direct download with
automatic updates, and a Mac App Store version is planned. A couple of
features are direct-build-only (auto-scroll for scrolling capture, and the
in-app update checker).

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

## Can people without Sealshot open what I send them?

Depends on the format. A flattened **PNG** or **`.mov`/`.mp4`** export
opens anywhere. A package exported as **`.zip`** opens anywhere too.
A **`.sealshare`** package needs Sealshot (plus the passcode, if
encrypted) — that's the format to use when the recipient should get the
full editable captures, safely.

## What if I lose my recovery key?

If you can still unlock (Touch ID or password), open **Settings → Privacy
& Security → Recovery code** and **View…** it again or **Generate New…**
to replace it. If you've lost your Mac's unlock methods *and* the recovery
key, the encrypted library cannot be recovered — there's no account and no
cloud copy, by design.

## What happens to captures I delete?

They move to the Library's **Trash**, where they wait (7 days by default,
configurable 1–365 in **Settings → General → Trash**) before being purged.
Restore them any time before that, undo an accidental delete with ⌘Z, or
clear everything with **Empty Trash**. "Delete Forever" is immediate and
permanent.

## A capture shortcut isn't working — why?

Most often another app already owns that key combo — global shortcuts are
first-come, first-served on macOS. Rebind the command in **Settings →
Shortcuts** (Sealshot itself won't let two of its own commands share a
combo). Also check the [defaults](/docs/guide/shortcuts/) — scrolling
capture moved to **⌘⇧W** in 0.7.0.

## Do my edits and undo history survive a relaunch?

Yes. The editor's undo/redo history is persistent across switching captures
and relaunching, and so is undo/redo for deleting and restoring captures.

## Is my library encrypted?

It can be. Turn on [Enhanced Security](/docs/guide/security/) to encrypt
your captures, recordings, search index, and OCR text at rest and lock
viewing behind Touch ID.

## I found a bug / I want a feature

We want to hear it — use the [feedback form](/support/).
