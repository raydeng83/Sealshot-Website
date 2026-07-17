---
title: "Workflow: write documentation people can follow"
description: Precise captures, consistent annotations, and screenshots that stay editable for the next release.
---

Good docs live and die by their screenshots — and screenshots are the
first thing to rot when the UI changes. This workflow produces precise,
consistent shots whose annotations you can revise next release instead of
redoing.

## The walkthrough

1. **Capture exactly the control you mean.** Press **⌘⇧C** and hover — the
   [unified overlay](/docs/guide/capture/#smart-capture-area--window)
   highlights the element under the cursor, and scrolling steps the
   selection outward from a single button to the panel to the whole
   window. For anything that hides on click — menus, tooltips — use
   [delayed capture](/docs/guide/capture/#delayed) (**⌘⇧D**); the screen
   freezes so the menu survives.

2. **Capture pages taller than the screen.**
   [Scrolling capture](/docs/guide/capture/#scrolling-capture) (**⌘⇧W**)
   stitches a long settings page or article into one image.

3. **Annotate with a consistent style.** Pick your doc convention once —
   say, orange arrows with a white outline and 2px stroke — and
   [each tool remembers its style](/docs/guide/editor/#annotation-tools),
   so shot #14 matches shot #1. Numbered badges keep multi-step figures
   readable; the **Outline** color keeps marks visible on any background.

4. **Keep everything editable.** Each figure is a
   [`.seal` package](/docs/guide/seal-format/): when the next release
   moves a button, reopen it, move the arrow, and re-export — no
   re-shooting, no hunting for the original.

5. **Organize by document.** A
   [collection](/docs/guide/library/#collections-and-favorites) per manual
   (or per release) keeps every figure findable, and OCR search means
   "which shot shows the proxy settings?" is a two-second question.

6. **Export flattened PNGs** (**⌘S**, or select several and export to a
   folder) into your docs repo.

:::tip
This site is written this way — the Sealshot manual's screenshots are
Sealshot captures, annotated in Sealshot, kept as `.seal` originals, and
re-exported whenever the app's UI changes.
:::
