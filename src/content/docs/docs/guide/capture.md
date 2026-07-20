---
title: Capture modes
description: Area, window, fullscreen, delayed, scrolling, and Live Capture — across all your displays.
---

Sealshot offers several ways to capture your screen. Start any of them from
the menu-bar icon, or use the [keyboard shortcut](/docs/guide/shortcuts/) —
each has a default you can change in Settings.

## Smart Capture (area & window)

**Default: ⌘⇧C.** One overlay does it all, over a frozen screen (so menus
and hover states survive):

- **Drag** across a region to capture an area — or click once to set a
  corner, move, and click again. Adjustable handles let you fine-tune the
  selection before confirming.
- **Hover** and Sealshot highlights what's under the cursor — a panel, a
  toolbar, a whole window — using smart boundary detection that snaps to
  real edges. **Scroll** to step the highlight outward from the smallest
  element to the full window, then **click** to capture exactly that.

Press **Esc** to cancel.

![Area selection overlay mid-drag](/manual/capture-area.png)
*Drag to select; refine with the handles, then confirm.*

![Window capture with a window highlighted](/manual/capture-window.png)
*Hover to highlight an element or window; scroll to grow the selection.*

## Fullscreen

**Default: ⌘⇧F.** One display, one shot. With a single display it captures
immediately; with several, a picker opens over a frozen screen — click the
display you want, or **⌘-click to capture all displays** stitched into one
image.

## Delayed

**Default: ⌘⇧D.** Need to capture something that disappears when you click?
A delayed capture runs an on-screen countdown (shown on every display), then
opens the unified overlay on the frozen screen. Choose the delay — **3
(default), 5, 10, or 15 seconds** — from the delay selector. Press **Esc**
during the countdown to cancel.

![Delayed-capture countdown](/manual/capture-delayed.png)
*A countdown gives you time to open menus or hover states.*

## Scrolling capture

**Default: ⌘⇧W** *(changed from ⌘⇧L in 0.7.0)*. Capture content taller than
the screen — long pages, chat threads, documents. Drag to select the scroll
viewport; Sealshot scrolls the content and stitches the frames into a single
seamless image.

- **Auto-scroll** (direct build, with Accessibility permission): Sealshot
  scrolls for you and stops at the end automatically.
- **Manual**: you scroll the content yourself and press **Return** to finish.

Press **Esc** at any time to cancel.

![Scrolling capture in progress](/manual/capture-scrolling.png)
*Sealshot scrolls and stitches a tall page into one image.*

## Live Capture

**Default: ⌘⇧X.** Capture your whole desktop as a **layered scene**. Live
Capture grabs *every* on-screen window as its own layer — plus each
display's wallpaper as the backdrop — and opens them in the
[editor](/docs/guide/editor/#live-capture-scenes) as a stack of movable
objects. Every window is captured **in full**, even ones buried behind
others at the time, so you can raise a hidden window, rearrange the desktop,
remove what you don't want, and annotate over the result.

- **All windows, in full.** Nothing is cut off by whatever was on top —
  each window is captured completely and sits on its own layer.
- **Multi-display.** On one display it captures immediately. With several, a
  picker opens — click a display to capture its windows and wallpaper, or
  **⌘-click to capture every display** into one combined scene.
- **In the editor**, drag windows around, bring one forward or send it back,
  delete the ones you don't need, and **Export This Window…** to save a
  single window on its own. See
  [Live Capture scenes](/docs/guide/editor/#live-capture-scenes).

:::note
A Live Capture is a snapshot — the captured windows are images, not live
apps. It captures the windows on your current desktop (Space); minimized
windows and windows on other Spaces aren't included.
:::

![A Live Capture scene open in the editor](/manual/capture-live.png)
*Every window becomes its own movable layer over the desktop wallpaper.*

## Save as…

**Default: ⌘⇧S.** Select a region and save it straight to a location you
choose with a Save panel. This is a one-off export — it doesn't add the
capture to your library or touch the clipboard.

## Recording

Sealshot records video too — the screen, a window, or a region, with audio.
See [Screen recording](/docs/guide/recording/).

## Where captures go

What happens to a finished capture — copy to the **Clipboard**, save to a
**File**, or **Both** — is set in **Settings → Capture → Capture Defaults**,
along with the filename format. The default is **Both**. Saved files land in
the folder chosen under **Settings → General → Storage**.

Captures that produce a file open in the [editor](/docs/guide/editor/),
ready to annotate. A **Clipboard-only** capture skips the editor — it goes
straight to your clipboard so you can paste and move on.

![The save-location setting](/manual/capture-destination.png)
*The save location in Settings → General; the Clipboard/File/Both default
lives in Settings → Capture.*
