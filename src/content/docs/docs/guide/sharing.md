---
title: Sharing & export
description: Encrypted .sealshare packages, image and video export, and drag-to-anywhere.
---

Screenshots often contain exactly the things you redact — so Sealshot's
sharing is built around **encrypted packages** that travel safely over
email, chat, or a USB stick, alongside plain image and video export when
that's all you need.

## Export to Package

Select captures (in the Library or the recent strip) and choose **Export to
Package…** (**⇧⌘E**, or File menu / right-click). The dialog offers:

- **Format** — `.sealshare` (opens in Sealshot, keeps everything editable)
  or `.zip` (opens anywhere).
- **Encrypt with a passcode** — on by default when Enhanced Security is on.
  Sealshot generates a strong passcode (like `K7M2Q-9XBHE-4FRPT-8WJ3N`);
  **Copy** it before exporting — share it with the recipient over a
  *different* channel than the package. There's no way to recover a lost
  passcode.
- **Expiry date** (optional) — recipients are warned when a package is past
  its date.
- A **hint** and **note** for the recipient, and an option to include the
  original un-redacted capture (off by default — leave it off unless you
  really need it).

![The Export to Package dialog](/manual/export-package.png)
*Pick a format, copy the passcode, export.*

## Opening a package

Open a `.sealshare` with **⌘O** (File → Import to Library…), by dragging it
onto Sealshot, or by double-clicking it. Encrypted packages ask for the
passcode (showing the sender's hint), then **Add to Library** or **Save to
Folder…**.

## Plain exports

- **Export to Image** (**⌘S**) — writes a flattened **PNG**; annotations and
  redactions are baked in, the editable `.seal` stays intact. Select several
  captures to export them all to a folder.
- **Export to Video…** — writes a recording back out as `.mov`/`.mp4`,
  singly or in batch.
- **Drag out** — drag a thumbnail from the recent strip straight into
  Finder, Mail, Slack, or any app.

:::tip[What actually gets shared]
Exports contain the *redacted, annotated* result. Solid-fill redactions are
flattened into the pixels — the covered content is not in the exported
file. The one exception is the explicit "include original un-redacted
capture" package option above.
:::
