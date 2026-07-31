---
title: The parts of Sealshot
description: A map of the app — the menu bar, the capture overlay, the editor and Library tabs, Settings, and what a capture actually is.
---

Sealshot has five places you'll spend time, and one file format that ties
them together. This page is the map; the [guide](/docs/guide/capture/)
covers each part in depth.

## The menu bar is the launcher

Sealshot lives in your menu bar rather than the Dock. Click its icon to
start any capture or recording, open the editor or Library, or reach
Settings — and every command shows its
[keyboard shortcut](/docs/guide/shortcuts/) right in the menu, so a capture
is one keystroke away from whatever app you're in.

![The Sealshot menu-bar icon and menu](/manual/menu-bar.png)
*Start captures and open the editor from the menu bar.*

## The capture overlay

Press a capture shortcut and Sealshot takes over the screen — **frozen**, so
menus and hover states hold still while you aim.

- **Hover** and it highlights the region under your cursor; **scroll** steps
  through the regions containing your pointer
- **Drag** for an exact area
- Hold **⌘** while dragging (or ⌘-click) to keep the selection adjustable —
  resize handles, a draggable interior, and a typed size — until you press
  **Return**
- **Esc** cancels, always

The same overlay serves area, window, delayed, and scrolling capture. See
[Capture modes](/docs/guide/capture/).

## One window, two tabs

This is the thing newcomers miss: the **editor** and the **Library** are two
tabs of the same window, with Settings alongside. Captures open in the
editor; the Library is where they all live.

### Inside the editor

| Where | What |
|---|---|
| Center | the **canvas** — your capture |
| Left of the toolbar | [drawing tools](/docs/guide/editor/#annotation-tools) — select, hand, crop, pen, line, arrow, shapes, text, step, blur |
| Right of the toolbar | on-device AI actions — Smart Redact, [Extract Data](/docs/guide/ai/#extract-structured-data), Enhance, Remove Background — plus [Find in Image](/docs/guide/ai/#find-in-image) |
| Above the canvas | the **zoom cluster** — slider, exact percentage, Fit / Fit width / Fit height / Actual size |
| Right sidebar | the [**Info panel**](/docs/guide/editor/#the-info-panel) — name, dimensions, summary, Smart Keywords, your tags, favorite star |
| Bottom | the [**recent strip**](/docs/guide/editor/#the-recent-strip) — your latest captures, one click away |

![A capture open in the Sealshot editor](/manual/editor-overview.png)
*The editor: toolbar, canvas, Info panel, and the recent-captures strip.*

### Inside the Library

The sidebar holds **All Files**, **Recents** (last 7 days), your
**Collections** with **Favorites** pinned on top, and **Trash** — plus
filters by tag, by date, and by media type. Press **Space** on any capture
for a [preview](/docs/guide/library/#preview) without opening the editor,
and switch between grid and list views to taste. See
[Library & search](/docs/guide/library/).

The thing worth knowing early: **search reads the text inside your images**,
so a capture is findable without ever being named or filed.

## Settings

Nine tabs — General, Capture, Recording, On-Device AI, Shortcuts,
Permissions, License, Privacy & Security, and About. Three are worth a
minute on day one:

- **Capture → Default destination** — Clipboard, File, or Both
- **General → Save location** — where captures land
- **Shortcuts** — rebind anything that clashes with another app

See [Settings](/docs/guide/settings/).

## What a capture actually is

Every capture is a [**`.seal` package**](/docs/guide/seal-format/): the
original untouched pixels, your annotations as live objects, the recognized
OCR text, the generated summary and keywords, and any cached extraction
results — together in one file.

That's why annotations stay editable indefinitely. When a button moves next
release, you reopen the `.seal`, drag the arrow, and re-export — rather than
re-taking the screenshot. Exports (PNG, MP4, or an encrypted package) are
flattened *copies*; the `.seal` original stays intact.

## Optional: the lock

Turn on [Enhanced Security](/docs/guide/security/) and everything Sealshot
stores is encrypted at rest — images, recordings, the search index, undo
history, and OCR text — with viewing behind Touch ID.

**Capturing keeps working while the library is locked**, so the protection
never costs you a shot.

Next: [your first capture](/docs/quickstart/first-capture/).
