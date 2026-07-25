---
title: "Recipes"
description: Short, specific jobs — and which workflow each one runs on.
---

The [six workflows](/docs/workflows/) cover the shapes. These are the
specific jobs, each in a few lines, pointing at the workflow that carries
the detail.

## Bug repro for a ticket

**Runs on:** [Explain](/docs/workflows/explain/) +
[Protect & share](/docs/workflows/protect-and-share/)

1. **⌘⇧C** the failing window — or **⌘⇧R** to
   [record](/docs/guide/recording/) it if the bug needs motion.
2. Number the steps *1 → 2 → 3* with badges, and an arrow for the moment
   it goes wrong.
3. **Smart Redact** — stack traces carry API keys, session tokens, and
   internal URLs straight into your issue tracker.
4. **⌘S** and attach. Three weeks later, search the error text instead of
   re-reproducing.

## Support reply with a screenshot

**Runs on:** [Explain](/docs/workflows/explain/)

1. **⌘⇧C**, hovering to grab exactly the control the customer is stuck
   on; **⌘⇧D** if it's a menu that closes.
2. One arrow, or badges if it's a sequence. Crop the rest away.
3. Copy to the clipboard, paste into the reply.

## Design feedback on a mockup

**Runs on:** [Explain](/docs/workflows/explain/)

1. **⌘⇧C** the region under discussion.
2. Numbered badges for each comment, so your written notes can say "see
   3".
3. Export a PNG into the thread; keep the `.seal` in case the next round
   needs the same marks moved.

## Figure for release notes

**Runs on:** [Publish](/docs/workflows/publish/)

1. Capture the new UI in your house annotation style.
2. File it in the collection for that release.
3. Export a flattened PNG; keep the `.seal` so the next release's version
   of the same figure is an edit, not a re-shoot.

## Screenshots for a product manual

**Runs on:** [Publish](/docs/workflows/publish/)

1. Pick the convention once — color, stroke, outline. Every tool
   remembers it.
2. **⌘⇧C** with scroll-out for precise elements, **⌘⇧D** for menus,
   **⌘⇧W** for pages taller than the screen.
3. One [collection](/docs/guide/library/#collections-and-favorites) per
   manual; bulk-export into the docs repo.
4. Next release: reopen, move the arrow, re-export.

## Narrated walkthrough or feature demo

**Runs on:** [Demonstrate](/docs/workflows/demonstrate/)

1. Close what shouldn't be on screen. **⌘⇧R** for a window, **⌘⇧V** for
   everything.
2. Mic on, **Reduce microphone noise** on, 3-second countdown on.
3. **⌘⇧P** to pause between steps — from the keyboard, so the HUD trip
   stays out of the take.
4. **File → Export to Video…** for an `.mp4` anyone can play.

## Async standup update

**Runs on:** [Demonstrate](/docs/workflows/demonstrate/)

1. **⌘⇧R** on the one window you're talking about.
2. Narrate for ninety seconds; **⌘⇧P** between topics.
3. Export and drop the file in the channel.

## Send an ID or bank statement

**Runs on:** [Protect & share](/docs/workflows/protect-and-share/)

1. **⌘⇧C**, or **⌘⇧W** for a multi-page statement.
2. **Smart Redact** — account numbers, SSNs, MRZ lines, and addresses
   come up pre-checked. Review and Apply.
3. **⇧⌘E** for a `.sealshare` with a passcode and an expiry.
4. Passcode over a different channel than the file. Always.

## Contract markup for review

**Runs on:** [Protect & share](/docs/workflows/protect-and-share/) +
[Explain](/docs/workflows/explain/)

1. **⌘⇧W** the contract page.
2. Arrows and highlights on the clauses in question.
3. Redact the counterparty details that your reviewer doesn't need.
4. Export as a package if it's genuinely confidential; a flattened PNG if
   it isn't.

## Receipts for tax time

**Runs on:** [Extract](/docs/workflows/extract/)

1. **⌘⇧C** every receipt as it crosses your screen, all year.
2. Right-click → add to *Receipts 2026*.
3. At tax time, **Extract Structured Data** pulls vendor, date, and total
   out as copyable text.
4. Search by vendor or amount when something doesn't reconcile.

## Table into a spreadsheet

**Runs on:** [Extract](/docs/workflows/extract/)

1. **⌘⇧C** the table — **⌘⇧W** if it scrolls.
2. [**Extract Structured Data**](/docs/guide/ai/#extract-structured-data)
   returns rows and columns as clean text.
3. Paste into the sheet. The result is cached in the `.seal`, so you can
   come back for it.

## Research clippings you'll want later

**Runs on:** [Remember](/docs/workflows/remember/)

1. **⌘⇧C** the paragraph, chart, or quote. Don't name it.
2. Let OCR and Smart Keywords index it on arrival.
3. Weeks later, search the phrase you half-remember.
4. Make a collection only once the project is real.

## The settings screen you finally got right

**Runs on:** [Remember](/docs/workflows/remember/)

1. **⌘⇧C** the working configuration before you touch anything else.
2. That's it — search "proxy" or "certificate" when it breaks again.
3. [OCR Live Text](/docs/guide/editor/#ocr-live-text) lets you copy the
   exact values back out.

:::tip
Don't see your job? Pick the [workflow](/docs/workflows/) whose *shape*
matches — are you explaining, publishing, demonstrating, protecting,
extracting, or remembering? The steps generalize further than the recipe
names suggest.
:::
