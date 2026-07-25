---
title: "Publish screenshots you'll maintain"
description: Build a set of related captures in one collection — consistent shot to shot, and re-exportable when the UI moves.
---

Some captures only make sense together: every figure in a manual, every
step of a tutorial, every image for one release. This workflow builds that
set. Each capture joins the same
[collection](/docs/guide/library/#collections-and-favorites) as you make
it, so the group stays consistent shot to shot, findable a year later, and
re-exportable when the UI moves.

## The steps

*[Capture](/docs/workflows/#1-capture) → [Refine](/docs/workflows/#3-refine)
→ [Organize](/docs/workflows/#4-organize) → Repeat →
[Deliver](/docs/workflows/#5-deliver)*

1. **Capture** — exactly the control you mean. **⌘⇧C** and hover — the
   [unified overlay](/docs/guide/capture/#smart-capture-area--window)
   highlights the element under the cursor, and scrolling steps the
   selection outward from a single button to the panel to the whole
   window. For menus and tooltips that vanish on click, use
   [delayed capture](/docs/guide/capture/#delayed) (**⌘⇧D**) — the screen
   freezes and the menu survives. For a page taller than the screen,
   [scrolling capture](/docs/guide/capture/#scrolling-capture)
   (**⌘⇧W**) stitches it into one image.

2. **Refine** — annotate in the house style. Pick your convention before
   shot #1 — say, orange arrows with a white outline at 2px — and
   [each tool remembers its style](/docs/guide/editor/#annotation-tools),
   so shot #14 matches shot #1 without you thinking about it. Numbered
   badges keep multi-step figures readable; the **Outline** color keeps
   marks legible against any background. Your marks stay editable without
   you doing anything about it: Sealshot stores every capture as a
   [`.seal` package](/docs/guide/seal-format/), where annotations remain
   live objects rather than baked pixels.

3. **Organize** — add it to the set's
   [collection](/docs/guide/library/#collections-and-favorites), one per
   manual or per release. Do it as you go and the set assembles itself; do
   it later and you're hunting for figure #37 among a year of screenshots.

4. **Repeat** — for every figure in the set. This is where the first three
   steps pay off: each tool still holds your style and the collection is
   already chosen, so shot #14 takes a fraction of the time shot #1 did —
   and matches it.

5. **Deliver** — export the set. Select the whole collection and write
   flattened PNGs into a folder in your docs repo, or **⌘S** for a single
   figure. Annotations flatten on the way out; the `.seal` originals stay
   untouched in your library.

## Later

This is the section the whole workflow exists for. When the next release
moves a button: reopen the `.seal`, drag the arrow, re-export. No
re-shoot, no hunting for the original, no rebuilding the annotation from
memory.

And when you can't remember which figure showed what,
[OCR search](/docs/guide/library/#search) reads inside the images —
"which shot shows the proxy settings?" is a two-second question.

## Combine with

[Explain](/docs/workflows/explain/) for one-off shots nobody will
maintain · [Extract](/docs/workflows/extract/) when a figure's text needs
to become copy.

## Recipes

[Figure for release
notes](/docs/workflows/recipes/#figure-for-release-notes) ·
[Screenshots for a product
manual](/docs/workflows/recipes/#screenshots-for-a-product-manual)

:::tip
This site is written this way. The Sealshot manual's screenshots are
Sealshot captures, annotated in Sealshot, kept as `.seal` originals, and
re-exported whenever the app's UI changes. Never flatten-and-discard —
the `.seal` is the asset, the PNG is just a build artifact.
:::
