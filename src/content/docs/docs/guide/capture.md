---
title: Capture modes
description: Area, window, fullscreen, delayed, element, and scrolling capture.
---

Sealshot offers several ways to capture your screen. Start any of them from
the menu-bar icon, or use the [keyboard shortcut](/docs/guide/shortcuts/) —
each has a default you can change in Settings.

## Area (unified capture)

**Default: ⌘⇧C.** One overlay does it all: drag across a region to capture an
area, or hover a window and click to capture it (see *Window* below). For an
area, drag across it — or click once to set a corner, move, and click again.
Either way you get adjustable handles to fine-tune the selection before
confirming. Hold **⌘** while dragging to adjust before capturing. Press
**Esc** to cancel.

![Area selection overlay mid-drag](/manual/capture-area.png)
*Drag to select; refine with the handles, then confirm.*

## Window

In the same unified overlay (⌘⇧C), hover a window and Sealshot highlights it
with smart boundary detection — snapping to its true edges — then click to
capture just that window.

![Window capture with a window highlighted](/manual/capture-window.png)
*Boundary detection snaps to the window's real edges.*

## Fullscreen

**Default: ⌘⇧F.** Capture the entire display under the pointer in one shot —
no overlay or selection.

## Delayed

**Default: ⌘⇧D.** Need to capture a menu or hover state that disappears when
you click? A delayed capture runs an on-screen countdown so you can set the
stage, then opens the unified overlay (the screen is frozen, so menus and
tooltips survive). Choose the delay — **3, 5, 10, or 15 seconds** — from the
delay selector in the editor toolbar. Press **Esc** during the countdown to
cancel.

![Delayed-capture countdown](/manual/capture-delayed.png)
*A countdown gives you time to open menus or hover states.*

## Element selection

Freeze-frame element selection pauses the screen, then lets you pick
individual UI elements — buttons, panels, toolbars — across all your
displays. Useful when you want exactly one control, cleanly cropped.

![Freeze-frame element selection](/manual/capture-element.png)
*Pause the screen and pick a single UI element.*

## Scrolling capture

**Default: ⌘⇧L.** Capture content taller than the screen — long pages, chat
threads, documents. Drag to select the scroll viewport; Sealshot scrolls the
content and stitches the frames into a single seamless image.

- **Auto-scroll** (direct build, with Accessibility permission): Sealshot
  scrolls for you and stops at the end automatically.
- **Manual**: you scroll the content yourself and press **Return** to finish.

Press **Esc** at any time to cancel.

![Scrolling capture in progress](/manual/capture-scrolling.png)
*Sealshot scrolls and stitches a tall page into one image.*

## Save as…

**Default: ⌘⇧S.** Select a region and save it straight to a location you
choose with a Save panel. This is a one-off export — it doesn't add the
capture to your library or touch the clipboard.

## Where captures go

A finished capture opens in the [editor](/docs/guide/editor/). What *also*
happens automatically — copy to the **Clipboard**, save to a **File**, or
**Both** — is set in **Settings → General → Capture Defaults**, along with the
save location and filename format. The default is **Both**.

![Capture destination setting](/manual/capture-destination.png)
*Choose Clipboard, File, or Both as the default destination.*
