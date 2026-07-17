---
title: The editor
description: Annotations, blur, crop and resize, enhance, background removal, OCR text, and export.
---

Every capture opens in Sealshot's **non-destructive** editor: your original
pixels are always preserved, and every annotation can be moved, restyled, or
removed later — even after you reopen the file.

![A capture open in the Sealshot editor](/manual/editor-overview.png)
*The editor: toolbar, canvas, Info panel, and the recent-captures strip.*

## Annotation tools

Pick a tool from the toolbar, then draw on the canvas. Tools include:

- **Arrow** and **Line** — with adjustable end-caps and solid/dashed/dotted
  styles.
- **Rectangle** and **Ellipse**.
- **Pen** — smoothed freehand strokes.
- **Text** — click to type; a full font picker with rich styling and
  per-word colour, size, and weight.
- **Numbered badges** — auto-incrementing step markers.
- **Blur** — see below.
- **Live Text** — select and copy recognized text (see OCR below).
- **Crop** — see *Crop and resize* below.
- **Hand** — pan around a zoomed canvas.

Each tool has its own colour, opacity, and stroke controls in the properties
panel — and each remembers its last-used style. Annotations can carry a
**drop shadow** (toggle it on, then aim it with the position pad or the
eight direction presets). Annotations live on their own layer above the
image, reorderable (send forward / send backward) from the properties panel.

![The annotation toolbar](/manual/editor-toolbar.png)
*Each tool carries its own colour, width, and style options.*

### Move, resize, rotate, flip

Select an object to get resize handles plus a rotate handle. Drag to rotate
(hold to snap to common angles), or use the properties panel / right-click
menu to set an exact angle or **flip horizontally / vertically**. Paste keeps
an object's transform.

![A selected object with rotate and resize handles](/manual/transform-handles.png)
*Resize from the handles; rotate from the top handle.*

## Blur and redaction

Select the **Blur** tool to hide sensitive content. Choose between:

- **Gaussian blur** — softens the region while hinting at what's there.
- **Solid fill** — paints over the region so the content underneath is
  unrecoverable. Use this for anything truly sensitive.

Blur regions can be a **rectangle**, **ellipse**, or a freehand **brush**. A
**strength** slider controls the intensity (it's labelled *Opacity* for Solid
fill), and for the brush a width control sizes the stroke.

![Gaussian blur and Solid fill compared](/manual/blur-panel.png)
*Gaussian blur hints at what's there; Solid fill makes it unrecoverable.*

:::tip[Let Sealshot find sensitive text for you]
Instead of redacting by hand, run [Smart Redaction](/docs/guide/redaction/)
— Sealshot scans the capture for emails, card numbers, API keys, IDs, and
more, and proposes redactions, all on device.
:::

## Crop and resize

- **Focus and crop** — drag the viewfinder brackets to crop or set a
  **focus** region. The original is preserved, so you can re-crop later.
- **Cut or copy a region** — the crop tool can lift a region out (⌘X leaves
  a transparent hole) or copy it (⌘C) for pasting elsewhere, with an
  aspect-ratio lock when you need exact proportions.
- **Resize** — set exact document dimensions from the Resize popover, with
  units and a ratio lock.
- **Revert to Original Image** returns to the untouched capture at any time.

![Focus/crop viewfinder brackets over an image](/manual/focus-crop.png)
*Drag the brackets to crop or set a focus region.*

## Enhance Clarity and Remove Background

- **Enhance Clarity** upscales and sharpens a capture on device, with
  tunable controls. Toggle between enhanced and original any time — the
  original is always kept.
- **Remove Background** cuts the subject out on device, leaving a
  transparent canvas or a background fill of your choice. Fully undoable.

## Insert images

Add another image on top of your capture — a logo, a second screenshot — via
**File → Insert Image on Canvas…** (⇧⌘I), or just drop a file onto the
canvas. Inserted images move, resize, and rotate like any other object.

## Zoom and navigation

**⌘-scroll** zooms toward the cursor from any tool; type an exact percentage
in the zoom field; the **Hand** tool pans. Fit-to-width and fit-to-height
are one click away.

## OCR Live Text

Select and copy text straight out of a screenshot — error messages, code,
addresses. **QR codes and barcodes** are recognized too: click one to open
its URL or copy its payload. Text recognition runs entirely on your Mac.

![Selecting recognized text inside a screenshot](/manual/ocr-live-text.png)
*Select and copy text directly from the image.*

## The Info panel

The **Info panel** on the right shows the capture's name, dimensions, and
its automatic summary and **Smart Keywords**, plus your own tags and a
favorite star — all editable in place. See
[On-device AI](/docs/guide/ai/) for how the summary and keywords are
generated.

## Undo that survives relaunch

The editor's undo history is **persistent**: quit and relaunch, switch
between captures, and you can still step backwards (⌘Z) and forwards (⇧⌘Z).
One history covers everything — annotations, resize, enhance, background
removal, metadata edits, and
[deleting and restoring captures](/docs/guide/library/#delete-restore-and-undo).

## Export

When you need a regular image, **File → Export to Image** (⌘S) writes a
flattened **PNG**; the **Copy** button puts the flattened image on the
clipboard. The editable `.seal` original stays intact, so you can always
re-export later — and for encrypted sharing or video export, see
[Sharing & export](/docs/guide/sharing/).
