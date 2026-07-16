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
results. Move a `.seal` to another Mac and all of it comes along.

With [Enhanced Security](/docs/guide/security/) on, the package contents
are encrypted at rest.

## Exporting

When you need a standard file, export from the editor: a flattened **PNG**
for images (⌘S), **`.mov`/`.mp4`** for recordings, or an encrypted
**`.sealshare`** package for sharing — see
[Sharing & export](/docs/guide/sharing/). The `.seal` original stays
intact, so you can always re-export differently later.
