---
title: The editor
description: Annotations, blur, focus and crop, image overlays, OCR text, and export.
---

Every capture opens in Sealshot's **non-destructive** editor: your original
pixels are always preserved, and every annotation can be moved, restyled, or
removed later — even after you reopen the file.

![A capture open in the Sealshot editor](/manual/editor-overview.png)
*The editor: toolbar, canvas, side panels, and the recent-captures strip.*

## Annotation tools

Pick a tool from the toolbar, then draw on the canvas. Tools include:

- **Arrow** and **Line** — with adjustable end-caps and solid/dashed/dotted
  styles.
- **Rectangle** and **Ellipse**.
- **Pen** — freehand strokes.
- **Text** — click to type a label; double-click to edit, with per-word
  colour, size, and weight.
- **Numbered badges** — auto-incrementing step markers.
- **Blur** — see below.
- **Live Text** — select and copy recognized text (see OCR below).
- **Crop** — trim the image to a new size (distinct from non-destructive
  focus/crop below).

Each tool has its own colour, stroke width, and style controls in the
properties panel. Annotations live on their own layer above the image, and you
can reorder them (send forward / send backward) from the properties panel.

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

![The blur tool's controls](/manual/blur-panel.png)
*Gaussian or Solid, with brush width and a strength slider.*

:::tip[Let Sealshot find sensitive text for you]
Instead of redacting by hand, turn on [Smart Redaction](/docs/guide/redaction/)
— Sealshot scans each capture for emails, phone numbers, card numbers, and
API keys and proposes redactions automatically, all on device.
:::

## Focus and crop

Crop to what matters using the viewfinder brackets, or set a **focus** region
to draw attention to part of the image. The original is preserved, so you can
re-crop later.

![Focus/crop viewfinder brackets over an image](/manual/focus-crop.png)
*Drag the brackets to crop or set a focus region.*

## Insert images

Add another image on top of your capture — a logo, an arrow you drew
elsewhere, or a second screenshot — via the **+** menu (**Insert Image on
Canvas…**) or the File menu. Inserted images move, resize, and rotate like any
other object.

## Enhance

The **Enhance** button runs an on-device image enhancement to make a capture
clearer. Toggle between the enhanced and original versions at any time — the
original is always kept.

## OCR Live Text

Select and copy text straight out of a screenshot — error messages, code,
addresses. Text recognition runs entirely on your Mac.

![Selecting recognized text inside a screenshot](/manual/ocr-live-text.png)
*Select and copy text directly from the image.*

## Undo that survives relaunch

The editor's undo history is **persistent**: quit and relaunch, switch
between captures, and you can still step backwards (⌘Z) and forwards (⇧⌘Z)
through your edits. Deleting and restoring captures is undoable too — see
[Library & search](/docs/guide/library/#delete-restore-and-undo).

## Export

When you need a regular image, **export** from the editor to **PNG**, **JPEG**,
or **TIFF**. There's also a **Copy** button that puts the flattened image on
the clipboard. The editable `.seal` original stays intact, so you can always
re-export differently later — see [The .seal format](/docs/guide/seal-format/).
