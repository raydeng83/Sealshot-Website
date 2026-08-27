---
title: Install & permissions
description: What Sealshot needs, how to install it, and the one permission macOS requires.
---

Sealshot is a privacy-first screenshot and screen-recording app for macOS.
Everything — capture, recording, text recognition, redaction, AI metadata,
search — runs on your Mac. Nothing you capture is uploaded, there's no
account, and there's no telemetry.

## Requirements

Sealshot runs on **macOS 14 (Sonoma) or later**, on both Apple Silicon and
Intel Macs (universal binary).

Everything core works the same on both: capture, recording, the editor,
OCR and search, and Smart Redaction's built-in detectors. Two extras need
newer hardware — the **enhanced redaction model** requires an Apple Silicon
Mac, and the **Apple Intelligence** features (generated summaries, smart
search, Thorough scan) require macOS 26 on an Apple Intelligence-capable
Mac. On Intel, Sealshot automatically uses its built-in on-device
processing instead. See [Which Macs run
what](/docs/guide/ai/#which-macs-run-what).

## Install

1. [Download the latest `.dmg`](/download/) from seal-shot.com.
2. Open the `.dmg` and drag **Sealshot** into your Applications folder.
3. Launch Sealshot from Applications.

![Dragging Sealshot into the Applications folder](/manual/install-drag.png)
*Drag Sealshot into Applications to install.*

Direct downloads are signed and notarized by Apple, so they launch without
Gatekeeper warnings, and they update themselves automatically via Sparkle.

Sealshot is **free to use** — every feature, no account needed, nothing that
expires. [Donating any amount](/donate/) supports the work; tick "I've
donated" in [Settings → Support](/docs/guide/settings/#support) and the
app's occasional reminder stops.

## Grant Screen Recording permission

The first time you capture, macOS asks for **Screen Recording** permission —
every screenshot app needs it. Sealshot uses it only while you're taking a
capture, and the pixels never leave your Mac.

If you missed the prompt, enable it manually in **System Settings → Privacy
& Security → Screen Recording**, then relaunch Sealshot.

![Granting Screen Recording permission in System Settings](/manual/permission-screen-recording.png)
*Turn on Sealshot under Screen Recording, then relaunch.*

:::note[Two more permissions, only if you use them]
[Scrolling capture's](/docs/guide/capture/#scrolling-capture) automatic mode
needs **Accessibility** permission so Sealshot can scroll the page for you,
and
[recording your voice](/docs/guide/recording/#audio) needs **Microphone**
permission. You'll be prompted the first time you use each.
:::

**Settings → Permissions** shows the live status of all three, each with a
button straight to the right System Settings pane.

Next: [the parts of Sealshot](/docs/quickstart/parts/).
