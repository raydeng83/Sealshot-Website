---
title: Settings
description: A tour of Sealshot's settings — general, capture, recording, on-device AI, shortcuts, permissions, and security.
---

Open Settings from the menu-bar icon. Settings are grouped into tabs down
the left side: **General**, **Capture**, **Recording**, **On-Device AI**,
**Shortcuts**, **Permissions**, **Privacy & Security**, and **About**. Most
tabs have a **Reset** for their own options, and General adds a **Reset
All**.

![Settings → General](/manual/settings-general.png)
*The General tab of Settings.*

## General

- **Appearance** — match the System theme, or force Light or Dark.
- **Storage** — the save location for captures *and* recordings (default
  `~/Pictures/Sealshot`).
- **Trash** — how many days trashed captures are kept before being purged
  (1–365; default **30**).
- **Startup** — launch Sealshot at login, and show the welcome tour cards.
- **Updates** — check for updates automatically (once a day). *(Direct build
  only.)*

## Capture

- **Capture Defaults** — the default destination (**Clipboard**, **File**,
  or **Both** — default Both), the **filename format**, and **Include title
  & app in filename**.
- **Scrolling Capture** — the **Auto-scroll** toggle (on by default; needs
  Accessibility permission). With it off, you scroll yourself and press
  Return to finish. *(Direct build only.)*

## Recording

Codec (**HEVC (.mov)** or **H.264 (.mp4)**), frame rate (30/60), system
audio, microphone, **Reduce microphone noise**, cursor visibility, and the
**Ask before each recording** prompt. See
[Screen recording](/docs/guide/recording/).

## On-Device AI

The **Use on-device AI** master switch, plus the **Smart Redaction**
options: automatic scanning, the optional ~400 MB enhanced redaction model,
and **Thorough scan**. See [On-device AI](/docs/guide/ai/) and
[Smart Redaction](/docs/guide/redaction/).

## Shortcuts

Global shortcuts for every capture, recording, and app command, grouped into
Capture / Recording / App cards. Each has a default you can rebind or clear;
combos already assigned to another action are rejected. See
[Keyboard shortcuts](/docs/guide/shortcuts/).

![Settings → Shortcuts](/manual/settings-shortcuts.png)
*Record a shortcut for each command.*

## Permissions

A live status list for the permissions Sealshot can use — **Screen
Recording** (required to capture), **Microphone** (only if you record your
voice), and **Accessibility** (auto-scroll, direct build only) — each with a
button to the right System Settings pane.

![Settings → Permissions](/manual/settings-permissions.png)
*Check and grant permissions from one place.*

## Privacy & Security

**Enhanced security** (encryption + Touch ID lock), your **recovery code**
(view or generate a new one), **Replace encryption key**, and **Auto-lock
when idle** (Off / 1 / 5 / 15 minutes). While Enhanced Security is on, this
tab itself requires Touch ID or your password to open. See
[Enhanced Security](/docs/guide/security/).

## About

Your version, and a **Send Feedback…** button that opens a pre-filled email
to the developer. See [Support & feedback](/support/).

:::note[About network activity]
Sealshot's only network activity is the daily update check (direct build)
and the **optional** enhanced-redaction model download — which happens only
after you approve it. Your captures and their data never leave your Mac.
:::
