---
title: "Explain something visually"
description: Capture precisely, mark what matters, redact what shouldn't leave, and send it.
---

Some things are faster to show than to write. A bug, a confusing control,
the cell that's wrong in someone's spreadsheet — one annotated screenshot
replaces three paragraphs. This workflow gets the picture into the ticket
or the chat, and nothing else along with it.

## Use this when

- Filing a bug and the stack trace is on screen
- Answering a support ticket that needs a picture
- Giving feedback on a design or a document
- Replacing a "click here, then here" email
- Flagging one thing inside a much busier screen

## Set up once

Set your annotation defaults the first time you use each tool — arrow
color, stroke width, outline. [Each tool remembers its
style](/docs/guide/editor/#annotation-tools), so you're not re-picking on
every shot.

If you screenshot terminals or admin panels all day, turn on **Scan
captures automatically** (Settings → On-Device AI). Every capture gets
checked for secrets the moment it opens, before you can forget.

## The loop

1. **Capture exactly the thing.** Press **⌘⇧C** and hover — the
   [unified overlay](/docs/guide/capture/#smart-capture-area--window)
   highlights the element under the cursor, and scrolling steps the
   selection outward from a button to the panel to the whole window. For
   anything that disappears on click — a menu, a tooltip — use
   [delayed capture](/docs/guide/capture/#delayed) (**⌘⇧D**); the screen
   freezes so the menu survives.

2. **Mark what matters.** An arrow for the thing you mean; numbered
   badges for *1 → 2 → 3* when order matters, auto-incrementing as you
   click. [Crop](/docs/guide/editor/#crop-and-resize) away everything
   that isn't the point — the **Outline** color keeps marks visible on
   any background.

3. **Redact before it leaves.** Click **Smart Redact** — the
   [on-device scan](/docs/guide/redaction/) flags API keys, tokens, JWTs,
   emails, and URLs with embedded credentials, pre-checked. Apply covers
   them with solid fill.

## Deliver

**⌘S** writes a flattened PNG with annotations and redactions baked in —
or copy straight to the clipboard and paste into the ticket or the chat
thread.

## Later

Three weeks on, when the ticket bounces back, don't re-reproduce
anything — [search](/docs/guide/library/#search) for the error message
text. OCR indexed the capture the moment you took it. The editable
[`.seal` original](/docs/guide/seal-format/) is still there too, so a
different crop is a reopen away.

## Combine with

[Protect & share](/docs/workflows/protect-and-share/) when the shot holds
real secrets rather than incidental ones ·
[Demonstrate](/docs/workflows/demonstrate/) when the problem only makes
sense in motion.

## Recipes

[Bug repro for a ticket](/docs/workflows/recipes/#bug-repro-for-a-ticket)
· [Support reply with a
screenshot](/docs/workflows/recipes/#support-reply-with-a-screenshot) ·
[Design feedback on a
mockup](/docs/workflows/recipes/#design-feedback-on-a-mockup)

:::caution
Redaction in the flattened export is **unrecoverable** — that's the
point, and it's why it's not a blur someone can undo. The `.seal`
original keeps the un-redacted pixels, so share the export, not the
original.
:::
