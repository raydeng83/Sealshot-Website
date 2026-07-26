---
title: "Tips: Deliver"
description: Exports, encrypted packages, and knowing exactly what leaves your Mac.
---

The last stage is the one with consequences: it's where a capture stops
being private. Most of these tips are about knowing precisely what's in the
file you just handed over.

## Getting a file out fast

- **Drag straight out to Finder or Mail.** Drag a thumbnail from the
  [recent strip](/docs/guide/library/#the-recent-strip) into Finder, Mail,
  Slack, or any app — no save dialog, no export menu.
- **Export a whole batch.** Select several captures and
  [Export to Image](/docs/guide/sharing/#plain-exports) (**⌘S**) writes them
  all into one folder. Recordings batch out the same way.
- **Pull one window out of a Live Capture.** Right-click a window in a
  [layered scene](/docs/guide/editor/#live-capture-scenes) and **Export This
  Window…** saves just that window as its own PNG.

## Exporting doesn't spend the original

- **You can always export again, differently.** ⌘S flattens annotations and
  redactions into a PNG, and the editable
  [`.seal`](/docs/guide/seal-format/) stays intact — so next month's
  different crop, format, or annotation is an edit rather than a re-shoot.
- **Recordings choose their own quality.** Set
  [quality and format](/docs/guide/recording/#quality-and-format) before
  **Export to Video…** rather than re-recording something that came out too
  large.

## Sending something sensitive

- **Set an expiry.** [Export to
  Package](/docs/guide/sharing/#export-to-package) (**⇧⌘E**) takes an expiry
  date, so the `.sealshare` stops opening on its own and you don't have to
  chase anyone to delete it. It takes an optional hint too, for the passcode.
- **Copy the passcode before the export unlocks.** It's generated for you at
  that moment — grab it while it's on screen.
- **Send the passcode down a different channel.** Package by email, passcode
  by Signal or a phone call. One intercepted inbox should never yield both
  halves.
- **Tell the recipient they have a choice.** Opening a package offers **Add
  to Library** or **Save to Folder…** — see [opening a
  package](/docs/guide/sharing/#opening-a-package).

## Know what's actually in the file

- **Solid-fill redactions really are gone.** In an export the covered
  content isn't in the file at all — it isn't a layer someone can peel back.
- **Except when you ask for it.** *Include original un-redacted capture* is
  the one package option that ships the un-redacted pixels alongside the
  redacted result. Leave it off unless the recipient genuinely needs the
  original.

:::caution
The `.seal` in your library still holds the un-redacted pixels — that's what
makes redaction reversible *for you*. So share the export, never the
`.seal`.
:::
