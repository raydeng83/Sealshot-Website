---
title: The .seal format
description: What .seal packages are, what they contain, and how to export standard formats.
---

Sealshot saves captures as `.seal` packages: the original, untouched pixels
plus your annotations, stored together in one file. Recordings use the same
container — a **video `.seal`** holds the movie plus its metadata.

## Why a custom format?

Flat image files bake annotations into the pixels — once you export, an
arrow can never be moved and a blur can never be adjusted. A `.seal` file
keeps everything editable: reopen it next month and rearrange, restyle, or
remove any annotation.

## What's inside

Alongside the original pixels and the annotation list, a `.seal` carries
the capture's own intelligence: the recognized **OCR text** (which powers
[library search](/docs/guide/library/#search)), the automatic **summary,
Smart Keywords, and your tags**, capture provenance (which app, when), and
cached [Extract Structured Data](/docs/guide/ai/#extract-structured-data)
results.

The editing state rides along too: any
[inserted images](/docs/guide/editor/#insert-images), the
[enhanced](/docs/guide/ai/#enhance-clarity-and-remove-background) and
background-removed alternates of the base image (with which one you were
showing), crop and [focus area](/docs/guide/editor/#focus-area), and a
ready-made composite and thumbnail so previews don't have to re-render.
Move a `.seal` to another Mac and all of it comes along.

With [Enhanced Security](/docs/guide/security/) on, the package contents
are encrypted at rest.

## One file, not a folder

A `.seal` is a single file. It used to be a folder that Finder displayed as one
item, which meant every capture showed the same generic icon and copying one
meant copying a directory. Now Finder shows each capture's own picture, and a
capture is one file to copy, move, or send.

Existing captures convert themselves quietly in the background — nothing to do,
and everything keeps working while it happens.

Two consequences worth knowing:

- **Double-clicking a `.seal` in Finder opens it.** One already in your library
  opens in place; one from anywhere else is copied in first — into your Library,
  or into [Scratch](/docs/guide/library/#scratch) if you have captures set to
  skip the Library — so opening a capture from a USB stick doesn't leave you
  editing a file that may vanish. Captures brought in this way are dated as they
  arrive, so they appear where you would expect: newest in the Library and the
  recent strip.
- **A protected capture shows no Finder preview.** With Enhanced Security on
  there is nothing to see outside Sealshot, deliberately: the preview extension
  holds no keys and never asks for them.

**File → Open Library Folder in Finder** (⇧⌘O) takes you to the folder, as does
the All Files row in the Library sidebar.

## Exporting

When you need a standard file, export from the editor: a flattened **PNG**
for images (⌘S), **`.mov`/`.mp4`** for recordings, or an encrypted
**`.sealshare`** package for sharing — see
[Sharing & export](/docs/guide/sharing/). The `.seal` original stays
intact, so you can always re-export differently later.
