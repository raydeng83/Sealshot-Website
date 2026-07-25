---
title: "Explain something visually"
description: Capture exactly the thing, mark what matters, and send it.
---

Some things are faster to show than to write. A bug, a confusing control,
the cell that's wrong in someone's spreadsheet — one annotated screenshot
replaces three paragraphs. This workflow gets the picture into the ticket
or the chat with the thing you mean already marked.

## The steps

*[Capture](/docs/workflows/#1-capture) → [Refine](/docs/workflows/#3-refine)
→ [Deliver](/docs/workflows/#5-deliver)*

1. **Capture** — exactly the thing. Press **⌘⇧C** and hover — the
   [unified overlay](/docs/guide/capture/#smart-capture-area--window)
   highlights the element under the cursor, and scrolling steps the
   selection outward from a button to the panel to the whole window. For
   anything that disappears on click — a menu, a tooltip — use
   [delayed capture](/docs/guide/capture/#delayed) (**⌘⇧D**); the screen
   freezes so the menu survives.

2. **Refine** — mark what matters. An arrow for the thing you mean; numbered
   badges for *1 → 2 → 3* when order matters, auto-incrementing as you
   click. [Crop](/docs/guide/editor/#crop-and-resize) away everything
   that isn't the point — the **Outline** color keeps marks visible on
   any background.

3. **Deliver** — send it. **⌘S** writes a flattened PNG with your
   annotations baked in, or copy straight to the clipboard and paste into
   the ticket or the chat thread.

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
Check what else is in the frame before it leaves. A stack trace or an admin
panel can carry API keys, tokens, or internal URLs you never noticed —
[Protect & share](/docs/workflows/protect-and-share/) covers finding and
covering them first.
:::
