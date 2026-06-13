---
title: Getting started
description: Install Sealshot, grant permissions, and take your first capture.
---

Sealshot is a privacy-first screenshot app for macOS. Everything — capture,
text recognition, redaction, search — runs on your Mac. Nothing is uploaded,
there's no account, and there's no telemetry.

## Requirements

Sealshot runs on **macOS 14 (Sonoma) or later**, on both Apple Silicon and
Intel Macs (universal binary).

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

:::note[Auto-scroll needs one more permission]
[Scrolling capture's](/docs/guide/capture/#scrolling-capture) automatic mode
also needs **Accessibility** permission so Sealshot can scroll the page for
you. You'll be prompted the first time you use it. (Auto-scroll is available
in the direct-download build only.)
:::

## Live in the menu bar

Sealshot sits in your menu bar. Click its icon to start any capture, open the
editor, or reach Settings. You can also assign global keyboard shortcuts so a
capture is one keystroke away from any app — see
[Keyboard shortcuts](/docs/guide/shortcuts/).

![The Sealshot menu-bar icon and menu](/manual/menu-bar.png)
*Start captures and open the editor from the menu bar.*

## Your first capture

Start an **area capture** and drag across the region you want. Fine-tune the
selection with the handles, then confirm — the capture opens in the editor,
ready to annotate, redact, or export.

From here, explore:

- [Capture modes](/docs/guide/capture/) — area, window, fullscreen, delayed,
  element, and scrolling capture.
- [The editor](/docs/guide/editor/) — annotations, blur, focus/crop, image
  overlays, and OCR text.
- [Smart Redaction](/docs/guide/redaction/) — automatic on-device detection
  of sensitive text.
- [Library & search](/docs/guide/library/) — organizing and searching your
  captures.
