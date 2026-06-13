---
title: Library & search
description: Organizing captures with the strip, grid, selection, automatic metadata, and OCR search.
---

The Library is home to every capture. It indexes your save folder locally, so
browsing, searching, and thumbnails are fast — and entirely on device.

![The Library in grid view](/manual/library-grid.png)
*The Library in grid view. Switch to list view from the toolbar.*

## Sections

The Library sidebar has three sections:

- **All Shots** — every capture, newest first.
- **Recents** — captures from the last 7 days.
- **Trash** — captures you've deleted, awaiting restore or permanent removal.

## The recent strip

While you're editing, a **recent-captures strip** runs along the bottom of the
window so your latest shots are one click away. Click a thumbnail to open it,
right-click for actions, or **drag a thumbnail out** to Finder, Mail, or any
app to export it as a PNG. Drag the strip's edge to resize the thumbnails.

![The recent-captures strip](/manual/library-strip.png)
*Jump between recent captures without leaving the editor.*

## Grid and list views

Switch between a thumbnail **grid** and a detailed **list** from the toolbar.
Use the view that fits the task — the grid for skimming, the list for
scanning titles and dates.

## Selecting captures

- **Click** a capture to select it; **double-click** to open it.
- **⌘-click** to add or remove individual captures.
- **⇧-click** to select a range.
- **Drag across empty space** to draw a selection rectangle (marquee) — every
  capture the rectangle touches is selected. Hold **⌘** or **⇧** while
  dragging to add to the current selection. Marquee works in the grid and in
  the recent strip.
- **Click empty space** to clear the selection.

![A marquee selection across several grid cards](/manual/library-marquee.png)
*Drag from empty space to rubber-band-select multiple captures.*

Once you've selected captures you can act on the whole set — delete, restore,
or show in Finder — from the toolbar or the right-click menu.

## Titles and the Info pane

Every capture is OCR'd on device, and the source app's name is recorded, so
search works without any manual effort. You can give a capture a **custom
title** that overrides its filename in the library.

The left **Info pane** (toggle it from the toolbar's **Info** button) shows the
capture's name, dimensions, an Enhance/Original toggle, tags, and a summary of
the objects (annotations) on it. Its open/closed state is remembered across
captures and relaunches.

![The Info pane showing capture metadata](/manual/library-info-pane.png)
*The Info pane: name, dimensions, tags, and an object summary.*

:::note
Automatic **titles, tags, and categories** are temporarily turned off while
that feature is refined — captures use their filename (or a title you set).
Local OCR and full-text search are unaffected.
:::

## Full-text search

Because every capture is OCR'd locally, search looks **inside** your
screenshots. Search for an error message, a name, or a code fragment and find
the capture that contains it — not just by filename.

![Searching text inside captures](/manual/library-search.png)
*Search matches text recognized inside the images themselves.*

## Delete, restore, and undo

Deleting a capture moves it to the **Deleted** section (trash) rather than
erasing it. From there you can **Restore** it to your library or **Delete
Forever**.

Both deleting and restoring are **undoable and redoable** (⌘Z / ⇧⌘Z), and the
history survives switching captures and relaunching the app — so an accidental
delete is easy to take back. "Delete Forever" is permanent and cannot be
undone.

![The Deleted section with Restore](/manual/library-deleted.png)
*Trashed captures wait in Deleted until you restore or purge them.*

Trashed captures are purged automatically after a number of days you set in
**Settings → General → Trash**.
