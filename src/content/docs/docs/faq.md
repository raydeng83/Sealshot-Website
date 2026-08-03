---
title: FAQ
description: Frequently asked questions about Sealshot.
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
---

## Privacy & your data

### Does Sealshot send my screenshots anywhere?

No. Capture, recording, OCR, redaction, AI metadata, and search all run on
your Mac. Nothing you capture is ever uploaded, there is no account, and
there is no telemetry. Sealshot's only network activity is checking for app
updates and — only if you approve it — downloading the optional
[enhanced redaction model](/docs/guide/redaction/#the-enhanced-on-device-model).
Both are downloads; your content never goes the other way. See the
[privacy policy](/privacy/) for the full picture.

### Where are my captures stored?

In the folder set under **Settings → General → Save location** (default
`~/Pictures/Sealshot`), as [`.seal` packages](/docs/guide/seal-format/) —
captures and recordings alike. With
[Enhanced Security](/docs/guide/security/) on, they're encrypted at rest.

### Is my library encrypted?

It can be. Turn on [Enhanced Security](/docs/guide/security/) to encrypt
your captures, recordings, search index, and OCR text at rest and lock
viewing behind Touch ID.

### What if I lose my recovery key?

If you can still unlock (Touch ID or password), open **Settings → Privacy
& Security → Recovery code** and **View…** it again or **Generate New…**
to replace it — the recovery screen also offers **Save Kit…** and
**Print…** so a copy can live outside this Mac, and Sealshot occasionally
asks you to confirm you still have the code.

If you've lost your Mac's unlock methods *and* the recovery code, the
encrypted captures cannot be decrypted — there's no account and no cloud
copy, by design. The lock screen's **"I can't unlock…"** option lets you
keep using the app: it moves the encrypted captures to a read-only
**Locked Archive** (nothing is deleted) and turns encryption off. Find the
code later and **Restore…** brings them back.

### What happens to captures I delete?

They move to the Library's **Trash**, where they wait (7 days by default,
configurable 1–365 in **Settings → General → Trash**) before being purged.
Restore them any time before that, undo an accidental delete with ⌘Z, or
clear everything with **Empty Trash**. "Delete Forever" is immediate and
permanent.

## Compatibility & requirements

### What does Sealshot run on?

macOS 14 (Sonoma) or later, as a universal binary for Apple Silicon and
Intel. Some [on-device AI](/docs/guide/ai/) extras use Apple Intelligence,
which needs macOS 26 on Apple Silicon — on other Macs those features fall
back to built-in on-device processing.

### Does Sealshot work on Intel Macs?

Yes — capture, recording, the editor, OCR and search, Smart Redaction's
built-in detectors, and structured extraction all work the same on Intel.
Two extras need newer hardware: the enhanced redaction model (Apple
Silicon) and the Apple Intelligence features (macOS 26 on Apple Silicon).
See [Which Macs run what](/docs/guide/ai/#which-macs-run-what).

### Is Sealshot on the Mac App Store?

No. Sealshot ships only as a signed, notarized direct download, and there is
one build with every feature in it. Downloading outside the App Store also
means Sealshot can update itself the moment a release is ready, and that
sandbox limits never decide what it is allowed to capture.

### Why does Sealshot need Screen Recording permission?

macOS requires it for any app that captures the screen. Sealshot uses it
only when you take a capture or recording, and the pixels never leave your
device. Microphone permission is only requested if you record your voice;
Accessibility only if you use auto-scroll.

## Buying, licensing & renewal

### How does the free trial work?

Every install starts with a **14-day free trial** — full-featured, no
account, no card. When it ends, new captures and recordings pause, but
**everything you've already captured stays fully viewable, editable, and
exportable.** Your data is never held hostage.

### Is Sealshot a subscription?

No. [Buying Sealshot](/buy/) is a **one-time purchase** of a perpetual
license — the app never stops working, and nothing renews automatically.
Your purchase includes an update window (new versions released during it
are yours forever); when it ends you can optionally renew to keep
receiving updates, or simply keep using what you have.

### What exactly do I get when I buy?

A **license file**, delivered instantly to your purchase email. It covers
**one user on two Macs**, includes **commercial use**, and comes with an
update window — every version released during that window is yours to
keep. Current pricing and update-window terms are on the
[buy page](/buy/).

### What is the Founding license?

An offer for buyers **before the 1.0 release**: the same perpetual
license, at a lower price and with a *longer* update window than the
regular license. It's a thank-you for early supporters, not a cut-down
edition — see the [buy page](/buy/) while it lasts.

### How do I activate my license? Do I need an account or internet?

Open the license file from your purchase email, or drag it onto
**Settings → License**. Activation is **entirely offline** — no account,
no activation server, nothing to sign in to. That also means Sealshot
works on Macs that never touch the internet.

### I got a new Mac — how do I move my license?

Just activate the same license file on the new Mac (your license covers
two). There's nothing to deactivate first — there's no activation server,
so no seat to release. Keep the file (or the purchase email) somewhere
safe, like any other important document.

### What happens when my update window ends?

Nothing, until you want a newer version. The app — and every version
released during your window — **keeps working forever**. Renewing from
**Settings → License** (or the [buy page](/buy/)) is entirely optional
and extends your window for another year of updates.

### What if I install a version newer than my license covers?

New captures and recordings pause, and everything you've captured stays
fully viewable, editable, and exportable. To keep capturing, either renew
your updates or go back to the newest version your license covers.

### Can I use an Individual license for work?

Yes — commercial use is included. The Business license exists for
organisations that want contracted seat counts, one invoice, and volume
pricing, not because individual licenses forbid work use.

### How does business or volume licensing work?

Businesses get an **offline organisation license**: a contracted seat
count on one invoice, with per-seat volume discounts as the count grows.
No accounts to provision and no activation server to allow-list — it
works on managed and air-gapped Macs alike. See the
[buy page](/buy/) or [contact us](/support/) for a quote.

## Capturing & editing

### Can Sealshot record video?

Yes — the full screen, a window, or a region, with system audio and
microphone, paused and resumed from a floating HUD. See
[Screen recording](/docs/guide/recording/).

### A capture shortcut isn't working — why?

Most often another app already owns that key combo — global shortcuts are
first-come, first-served on macOS. Rebind the command in **Settings →
Shortcuts** (Sealshot itself won't let two of its own commands share a
combo). Also check the [defaults](/docs/guide/shortcuts/) in case the
binding isn't what you remember.

### Do my edits and undo history survive a relaunch?

Yes. The editor's undo/redo history is persistent across switching captures
and relaunching, and so is undo/redo for deleting and restoring captures.

## Files & sharing

### What is a .seal file?

Sealshot's native format: your original pixels (or video) plus annotations
and metadata in one editable package. See
[The .seal format](/docs/guide/seal-format/).

### How do I share a capture securely?

Export it as an encrypted `.sealshare` package with a generated passcode —
see [Sharing & export](/docs/guide/sharing/).

### Can people without Sealshot open what I send them?

Depends on the format. A flattened **PNG** or **`.mov`/`.mp4`** export
opens anywhere. A package exported as **`.zip`** opens anywhere too.
A **`.sealshare`** package needs Sealshot (plus the passcode, if
encrypted) — that's the format to use when the recipient should get the
full editable captures, safely.

## Redaction & on-device AI

### Can Sealshot automatically detect sensitive information?

Yes. [Smart Redaction](/docs/guide/redaction/) scans captures on your Mac —
on demand, or automatically if you enable it — for emails, phone numbers,
addresses, card numbers, IDs (SSNs, passport MRZ), and API keys/tokens, and
proposes redactions for you to review. An optional on-device model extends
detection to sensitive content by meaning. It detects sensitive **text**,
not faces — use the [blur tool](/docs/guide/editor/#blur-and-redaction) for
faces, logos, and other imagery.

### Why does Sealshot offer to download a ~400 MB model?

That's the optional [enhanced redaction model](/docs/guide/redaction/#the-enhanced-on-device-model),
which recognizes sensitive content by meaning rather than pattern (and
improves structured extraction too). It downloads only after you approve
it, runs entirely on your Mac, and can be removed any time in **Settings →
On-Device AI**. Decline it and the built-in detectors keep working.

## Updates & support

### How do I update Sealshot?

Direct downloads update themselves via Sparkle — you'll be offered new
versions automatically. Every release is also published on
[GitHub](https://github.com/raydeng83/Sealshot-Release/releases).

### I found a bug / I want a feature

We want to hear it — use the [feedback form](/support/).
