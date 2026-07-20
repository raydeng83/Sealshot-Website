---
title: Getting started
description: Install Sealshot, grant permissions, and take your first capture.
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
Mac, and the **Apple Intelligence** features (generated summaries, smarter
search, Thorough scan) require macOS 26 on an Apple Intelligence-capable
Mac. On Intel, Sealshot automatically uses its built-in on-device
processing instead. See [On-device AI](/docs/guide/ai/#which-macs-run-what).

## Install

1. [Download the latest `.dmg`](/download/) from seal-shot.com.
2. Open the `.dmg` and drag **Sealshot** into your Applications folder.
3. Launch Sealshot from Applications.

![Dragging Sealshot into the Applications folder](/manual/install-drag.png)
*Drag Sealshot into Applications to install.*

Direct downloads are signed and notarized by Apple, so they launch without
Gatekeeper warnings, and they update themselves automatically via Sparkle.

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
needs **Accessibility** permission so Sealshot can scroll the page for you
(direct-download build only), and
[recording your voice](/docs/guide/recording/#audio) needs **Microphone**
permission. You'll be prompted the first time you use each.
:::

## Live in the menu bar

Sealshot sits in your menu bar. Click its icon to start any capture or
recording, open the editor or Library, or reach Settings — each command
shows its keyboard shortcut right in the menu, so a capture is one keystroke
away from any app. See [Keyboard shortcuts](/docs/guide/shortcuts/).

![The Sealshot menu-bar icon and menu](/manual/menu-bar.png)
*Start captures and open the editor from the menu bar.*

## Your first capture

Start an **area capture** and drag across the region you want. Fine-tune the
selection with the handles, then confirm — the capture opens in the editor,
ready to annotate, redact, or export.

From here, explore:

- [Capture modes](/docs/guide/capture/) — area, window, fullscreen, delayed,
  scrolling, and Live Capture, across all your displays.
- [Screen recording](/docs/guide/recording/) — record the screen, a window,
  or a region, with audio.
- [The editor](/docs/guide/editor/) — annotations, blur, crop and resize,
  enhance, and OCR text.
- [Smart Redaction](/docs/guide/redaction/) — automatic on-device detection
  of sensitive text.
- [On-device AI](/docs/guide/ai/) — automatic titles and summaries, and
  structured-data extraction.
- [Library & search](/docs/guide/library/) — collections, favorites, and
  search across your captures.
- [Sharing & export](/docs/guide/sharing/) — encrypted share packages and
  plain exports.
