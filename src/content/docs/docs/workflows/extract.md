---
title: "Extract data from a capture"
description: Turn invoices, tables, and on-screen text into clean, copyable data — on your Mac.
---

The number you need is on screen but not selectable: a receipt in an
email, a total in a dashboard, a table in a PDF someone sent as an image.
This workflow turns pixels back into text you can paste.

## Use this when

- Receipts and invoices at expense or tax time
- A table in a web dashboard that has no CSV export
- Line items, totals, dates, and vendor fields
- A paragraph you want to quote
- Error text you need to paste into a search box
- Notes someone left on a whiteboard

## Set up once

Make a [collection](/docs/guide/library/#collections-and-favorites) for
the batch — *Receipts 2026*, *Q3 numbers* — so the captures accumulate
somewhere on purpose. OCR and
[Smart Keywords](/docs/guide/ai/#automatic-titles-summaries-and-smart-keywords)
run automatically on arrival; you don't configure anything for
findability.

## The loop

*[Capture](/docs/workflows/#1-capture) →
[Organize](/docs/workflows/#4-organize) → [Refine](/docs/workflows/#3-refine)
→ [Deliver](/docs/workflows/#5-deliver) — the one workflow that files
before it refines, because you capture all year and extract at the end*

1. **Capture** — as it crosses your screen. Whenever a receipt, invoice, or
   confirmation appears, **⌘⇧C** it. For a long statement,
   [scrolling capture](/docs/guide/capture/#scrolling-capture) (**⌘⇧W**)
   stitches the whole page into one image.

2. **Organize** — file it. Right-click → add to the collection, and add a
   tag or two if it helps. Don't bother renaming — search reads the
   contents.

3. **Refine** — extract when you need the fields. Open the capture and hit
   [**Extract Structured Data**](/docs/guide/ai/#extract-structured-data)
   — tables, line items, totals, dates, and vendor fields come out as
   clean, copyable text. The result is cached in the `.seal`, so
   re-opening it is instant.

   ![The Extracted Data window pulling an invoice apart](/manual/extract-data.png)

## Deliver

Copy the extracted text into your spreadsheet, ledger, or expense tool.
For a plain text grab rather than structured fields,
[OCR Live Text](/docs/guide/editor/#ocr-live-text) lets you select
straight off the image.

## Later

[Search looks inside the images](/docs/guide/library/#search) — a vendor
name, an invoice number, even an amount. On Apple Intelligence Macs the
query [expands to related terms](/docs/guide/ai/#smarter-search), so
"invoice" also finds "receipt".

## Combine with

[Protect & share](/docs/workflows/protect-and-share/) before you forward
a receipt to anyone — a quick Smart Redact pass covers the card number
and address · [Remember](/docs/workflows/remember/), since these captures
stay findable whether or not you ever extract them.

## Recipes

[Receipts for tax time](/docs/workflows/recipes/#receipts-for-tax-time) ·
[Table into a spreadsheet](/docs/workflows/recipes/#table-into-a-spreadsheet)

:::tip
Everything here — OCR, extraction, keywords, search — runs
[on your Mac](/docs/guide/ai/). Your financial paperwork never touches a
cloud service, which is rather the point.
:::
