---
title: "Publish screenshots you'll maintain"
description: A consistent, precise figure set whose annotations you revise next release instead of redoing.
---

Good documentation lives and dies by its screenshots — and screenshots
are the first thing to rot when the UI changes. This workflow produces a
figure *set*: consistent shot to shot, and editable next release so you
revise instead of re-shooting.

## Use this when

- Screenshots for a product manual or help site
- A tutorial or onboarding walkthrough
- Figures for release notes
- Marketing or landing-page imagery
- Anything you'll have to redo when a button moves

## Set up once

Pick your convention before shot #1 — say, orange arrows with a white
outline at 2px. [Each tool remembers its
style](/docs/guide/editor/#annotation-tools), so shot #14 matches shot #1
without you thinking about it.

Then make a
[collection](/docs/guide/library/#collections-and-favorites) per manual,
or per release. It's the difference between a figure set and a pile of
screenshots.

## The loop

*[Capture](/docs/workflows/#1-capture) → [Refine](/docs/workflows/#3-refine)
→ [Organize](/docs/workflows/#4-organize) →
[Deliver](/docs/workflows/#5-deliver) — then back to Refine next release*

1. **Capture** — exactly the control you mean. **⌘⇧C** and hover — the
   [unified overlay](/docs/guide/capture/#smart-capture-area--window)
   highlights the element under the cursor, and scrolling steps the
   selection outward from a single button to the panel to the whole
   window. For menus and tooltips that vanish on click, use
   [delayed capture](/docs/guide/capture/#delayed) (**⌘⇧D**) — the screen
   freezes and the menu survives. For a page taller than the screen,
   [scrolling capture](/docs/guide/capture/#scrolling-capture)
   (**⌘⇧W**) stitches it into one image.

2. **Refine** — annotate in the house style. Your saved defaults do the work.
   Numbered badges keep multi-step figures readable; the **Outline**
   color keeps marks legible against any background.

3. **Refine** — and keep it editable. Save the
   [`.seal` package](/docs/guide/seal-format/) — annotations stay live
   objects, not baked pixels.

4. **Organize** — file it in the collection for its manual or release, so
   figure #37 is findable a year from now.

## Deliver

**⌘S** for a single flattened PNG, or select the whole set and export to
a folder in your docs repo. Annotations flatten on the way out; the
`.seal` originals stay untouched in your library.

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
