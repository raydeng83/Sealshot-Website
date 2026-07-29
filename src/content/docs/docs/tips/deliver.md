---
title: "Tips: Deliver"
description: Quick exports, encrypted packages, and knowing exactly what's in the file you send.
---

Delivering is where a capture leaves your Mac. These tips cover getting a
file out fast, sharing something sensitive, and knowing exactly what's in
the file you hand over.

:::caution
The `.seal` in your library still holds the un-redacted pixels — that's what
makes redaction reversible *for you*. **Share the export, never the
`.seal`.**
:::

## Quick exports

- **Drag straight out.** Drag a thumbnail from the
  [recent strip](/docs/guide/editor/#the-recent-strip) into Finder, Mail,
  Slack, or any app — no save dialog, no export menu.
- **Export a batch.** Select several captures and
  [Export to Image](/docs/guide/sharing/#plain-exports) (**⌘S**) writes them
  all into one folder. Recordings batch out the same way.


## Encrypted packages

- **Set an expiry.** [Export to
  Package](/docs/guide/sharing/#export-to-package) (**⇧⌘E**) takes an expiry
  date, so the `.sealshare` stops opening on its own — no need to chase
  anyone to delete it. It takes an optional passcode hint too.
- **Copy the passcode while it's on screen.** It's generated at export time —
  grab it before the dialog closes.
- **Send the passcode separately.** Package by email, passcode by Signal or
  a phone call. One intercepted inbox should never yield both halves.
- **The recipient chooses.** Opening a package offers **Add to Library** or
  **Save to Folder…** — see [opening a
  package](/docs/guide/sharing/#opening-a-package).

## What's in the file

- **Exported images are flattened.** The annotation objects are baked into
  the image, so re-importing an export won't recover them as objects.
- **"Include original un-redacted capture" ships the original.** That one
  package option includes the un-redacted pixels alongside the redacted
  result. Leave it off unless the recipient genuinely needs the original.
