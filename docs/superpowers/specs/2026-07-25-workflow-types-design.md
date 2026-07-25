# Workflow types: generalizing the six workflow docs

**Date:** 2026-07-25
**Status:** implemented

**Status note (2026-07-25, later the same day):** the pages have since been
reworked past what this spec describes. The seven-part skeleton was cut back
to a single `## The steps` list (with Deliver folded in as the last step),
`Use this when` / `Set up once` / `Later` were dropped from most pages, and
the **Remember** type was withdrawn — six types are now five, thirteen
recipes are now eleven. Treat the sections below as the original design
record, not as a description of the current pages.

**Revision (same day):** the spine was renamed and reordered after review —
see [The spine](#the-spine). "File" read as a noun (and as the File menu),
and encryption belonged early as an automatic at-rest stage rather than
being conflated with redaction. The overview page now explains all five
stages in detail, and each type page names the stages it uses.

## Problem

`/docs/workflows/` holds six pages, each named after one narrow scenario:
bug reports, sensitive documents, walkthrough videos, receipts to data,
documentation, knowledge library.

Two consequences:

1. **Readers self-select out.** Someone whose job is "answer a support
   ticket with a screenshot" does not see themselves in "report a bug
   without leaking your stack," even though the steps are identical.
2. **Features are re-explained.** Smart Redact appears in three of the six
   pages, scrolling capture in three, library search in four — each time
   from scratch, with no shared vocabulary and no single owner for the
   explanation.

All six already walk the same spine without ever naming it.

## The spine

> **Capture → Encrypt** *(optional)* **→ Refine → Organize → Deliver**

Only Capture is mandatory. The stages, and why they sit in this order:

| Stage | What it is | Who does it |
| --- | --- | --- |
| **Capture** | Smart Capture, fullscreen, delayed, scrolling, recording | You |
| **Encrypt** *(optional)* | Enhanced Security: AES-256-GCM at rest, covering captures, recordings, search index, undo history, and OCR text; Touch ID to view | Automatic, once enabled |
| **Refine** | Annotation, crop, blur **and redaction**; plus the AI half — OCR, titles/summaries/Smart Keywords, Extract Structured Data, Enhance Clarity, Remove Background | Both |
| **Organize** | Titles, tags, collections, favorites — and the automatic index that makes search work without any of them | Both |
| **Deliver** | Flattened PNG, video export, `.sealshare` package — or nothing at all | You |

Two decisions worth recording:

- **Encrypt sits second** because it never blocks the first stage:
  capturing works even while the library is locked, so protection at rest
  costs nothing at the moment of capture. It is a state, not an action —
  enabled once in Settings, then invisible.
- **Redaction lives in Refine**, not in Encrypt and not as its own stage.
  Encrypt is protection *at rest*; redaction permanently removes content
  from the *export*. Refine owns the explanation because that is where it
  is in the app (an editor tool, alongside blur and crop), and Deliver
  carries a one-line reminder that the flattened export bakes it in.

An earlier draft used *Capture → Refine → Protect → File → Deliver*.
"File" was rejected as reading like a noun — and specifically like the File
menu — and "Protect" was rejected for conflating at-rest encryption with
redaction. Note that "Capture" has the same noun ambiguity (the docs say
"every capture"), but it is established domain vocabulary and not worth
renaming.

## Solution

Make the spine explicit. Organize workflow docs by **intent** — what the
reader is trying to accomplish with a capture — and demote the six
scenarios to short recipes that point into the intent pages.

Two layers:

- **Type pages** (6) — canonical, carry the full step skeleton.
- **Recipes** (1 page, 13 anchors) — a goal line and 2–4 steps each,
  linking into the type pages. Cheap to extend; no new file per recipe.

### Why intent, not another axis

- **Artifact** (still / long page / video / data) duplicates how
  `/docs/guide/*` is already organized.
- **Audience exposure** (just me / teammate / outside the org) maps well
  onto the privacy story but forces every page to cover every artifact
  kind, which fights the shared skeleton. Kept in reserve as a possible
  secondary tag, not implemented now.

## The six types

| Page title (H1) | Sidebar label | URL | Replaces |
| --- | --- | --- | --- |
| Explain something visually | Explain | `/docs/workflows/explain/` | `bug-reports` |
| Publish screenshots you'll maintain | Publish | `/docs/workflows/publish/` | `documentation` |
| Demonstrate it in motion | Demonstrate | `/docs/workflows/demonstrate/` | `walkthrough-videos` |
| Share sensitive captures safely | Protect & share | `/docs/workflows/protect-and-share/` | `sensitive-documents` |
| Extract data from a capture | Extract | `/docs/workflows/extract/` | `receipts-to-data` |
| Remember what you saw | Remember | `/docs/workflows/remember/` | `knowledge-library` |
| Recipes | Recipes | `/docs/workflows/recipes/` | — (new) |
| Workflows overview | Workflows | `/docs/workflows/` | — (new) |

**Explain vs. Publish** is a deliberate split of what used to be two
unrelated-feeling pages. Explain is one-off and disposable, aimed at one
person. Publish is a maintained *set* of figures that must survive the
next UI change. The disciplines differ enough that merging them buries
the maintenance story.

## The shared step skeleton

Every type page uses these sections, in this order:

1. `## Use this when` — 3–5 concrete jobs this type covers. This is where
   the old specific phrasings ("filing a bug", "receipts at tax time")
   keep their search surface.
2. `## Set up once` — the settings that make the workflow work.
3. `## The loop` — numbered steps; the part you repeat.
4. `## Deliver` — the output form for this type.
5. `## Later` — find it again, revise it, keep it current.
6. `## Combine with` — one line naming the types that chain with this one.
7. `## Recipes` — links to the matching anchors on the recipes page.
8. A trailing `:::caution` or `:::tip` callout with the pitfall — **no
   heading**, matching the existing house style where every workflow doc
   ends in a callout.

Two sanctioned deviations:

- **Remember** renames section 4 to `## Find it again` — retrieval *is*
  the deliverable; there is no export.
- **Publish** is the only page where section 5 carries real weight; on
  the others it stays short.

`## Combine with` is how the current duplication collapses. Explain and
Extract link to Protect & share for redaction detail instead of
re-explaining Smart Redact; Demonstrate links to Protect & share for
encrypted delivery and to Explain for companion stills.

## Per-type content

### Explain — `/docs/workflows/explain/`

- **Use this when:** filing a bug, answering a support ticket, giving
  design feedback, replacing a "click here, then here" email, flagging a
  cell in someone's spreadsheet.
- **Set up once:** annotation style defaults; *Scan captures
  automatically* (Settings → On-Device AI) if you screenshot terminals.
- **The loop:** capture precisely (⌘⇧C hover and scroll-out; ⌘⇧D delayed
  capture for menus that vanish on click) → mark what matters (arrows,
  numbered badges, crop the noise) → redact before it leaves → copy or
  export.
- **Deliver:** ⌘S writes a flattened PNG; or straight to the clipboard
  into the ticket or chat.
- **Later:** search the error text instead of re-reproducing the bug; the
  `.seal` keeps the un-flattened original for a different crop tomorrow.
- **Combine with:** Protect & share (secrets in the shot), Demonstrate
  (needs motion).
- **Pitfall:** the flattened export bakes redaction in permanently — a
  blur would not.

### Publish — `/docs/workflows/publish/`

- **Use this when:** a product manual, a tutorial, onboarding material,
  release notes, marketing figures — any screenshot set you will have to
  redo when the UI moves.
- **Set up once:** pick the house convention once (color, stroke width,
  outline — each tool remembers its style, so shot #14 matches shot #1);
  create a collection per manual or per release.
- **The loop:** capture exactly the control you mean (unified overlay
  scroll-out, ⌘⇧D for menus, ⌘⇧W scrolling capture for tall pages) →
  annotate in the house style → keep the `.seal` editable → file into the
  collection.
- **Deliver:** bulk-export flattened PNGs into the docs repo.
- **Later:** next release, reopen the `.seal`, move the arrow, re-export
  — no re-shoot. OCR search answers "which shot shows the proxy
  settings?" in two seconds. *This section is the reason the type
  exists.*
- **Combine with:** Explain (one-off shots), Extract (figures that need
  their text pulled out).
- **Pitfall:** never flatten-and-discard; the `.seal` is the asset.
- Keep the existing note that this site's own manual is produced this
  way.

### Demonstrate — `/docs/workflows/demonstrate/`

- **Use this when:** a narrated walkthrough, a repro that only makes
  sense in motion, a feature demo, an async standup update.
- **Set up once:** microphone on, *Reduce microphone noise* (on by
  default), 3-second countdown, and decide window vs. whole screen.
- **The loop:** set the stage → ⌘⇧R for a window or region, ⌘⇧V for the
  whole screen → ⌘⇧P to pause between steps, from the keyboard, so the
  trip to the HUD stays out of the take → stop and review in the Library
  (video `.seal`, plays in the editor, Space for a quick look).
- **Deliver:** File → Export to Video… writes `.mp4`/`.mov`.
- **Later:** pair the video with two or three annotated stills of the
  moments people will want to reference.
- **Combine with:** Protect & share (encrypted delivery instead of a
  plain video file), Explain (the companion stills).
- **Pitfall:** the mic hears your room, and the screen shows whatever you
  left open — check both before the countdown ends.

### Protect & share — `/docs/workflows/protect-and-share/`

This is the page every other type links to for redaction detail; it owns
that explanation.

- **Use this when:** bank statements, IDs, medical paperwork, contracts,
  anything carrying an account number — and any capture leaving your
  organization.
- **Set up once:** Enhanced Security on (AES-256-GCM at rest, Touch ID,
  auto-lock) and the enhanced on-device redaction model.
- **The loop:** capture (⌘⇧C, or ⌘⇧W for a long statement) → Smart Redact
  with document-aware detection: account and card numbers, SSNs, passport
  MRZ lines, addresses, money amounts on financial documents; high-risk
  items start pre-checked — review the list and Apply → confirm the
  un-redacted original stays sealed on disk.
- **Deliver:** ⇧⌘E Export to Package → a `.sealshare` with a generated
  passcode, optional expiry and hint. Send the passcode over a different
  channel than the file.
- **Later:** the recipient double-clicks, enters the passcode, and picks
  **Add to Library** or **Save to Folder…**; the expiry does the cleanup.
- **Combine with:** every other type — this is the sensitive path through
  any of them.
- **Pitfall:** *Include original un-redacted capture* stays off unless
  the recipient genuinely needs it.

### Extract — `/docs/workflows/extract/`

- **Use this when:** receipts and invoices, a table in a web dashboard,
  line items and totals, a paragraph you want to quote, error text you
  need to paste, notes on a whiteboard.
- **Set up once:** a collection for the batch (*Receipts 2026*); OCR and
  Smart Keywords are automatic.
- **The loop:** capture as it crosses your screen (⌘⇧W for long
  statements) → file it in the collection with a tag or two → **Extract
  Structured Data** when you need the fields; the result is cached in the
  `.seal`, so reopening is instant.
- **Deliver:** clean copyable text into a spreadsheet or expense tool.
- **Later:** search by vendor, invoice number, even an amount — search
  reads inside the images, and on Apple Intelligence Macs the query
  expands to related terms.
- **Combine with:** Protect & share (before forwarding a receipt),
  Remember (the capture stays findable either way).
- **Pitfall:** everything here runs on your Mac; financial paperwork
  never touches a cloud service.

### Remember — `/docs/workflows/remember/`

- **Use this when:** order confirmations, bookings, a settings screen you
  finally got right, research clippings, anything you would otherwise
  write down and lose.
- **Set up once:** nothing, deliberately. Optionally Enhanced Security,
  since this becomes a diary of your screen.
- **The loop:** ⌘⇧C without ceremony — no naming, no filing — and let OCR
  plus on-device title, summary, and Smart Keywords happen on arrival.
- **Find it again** *(replaces Deliver)*: type what you remember — a
  vendor, an error code, a confirmation number, a phrase; Space for Quick
  Look; date and tag facets when search is too broad.
- **Later:** curate only what earns it. Star what you return to; make a
  collection only when a real project emerges.
- **Combine with:** Extract (pull the numbers out of what you kept).
- **Pitfall:** this is a diary of your screen — treat it like one, and
  encrypt it.

## The recipes page

`/docs/workflows/recipes/` — one page, `##` anchors, each recipe a goal
line plus 2–4 steps that link into the type pages. Initial set:

| Recipe | Types |
| --- | --- |
| Bug repro for a ticket | Explain + Protect & share |
| Support reply with a screenshot | Explain |
| Design feedback on a mockup | Explain |
| Figure for release notes | Publish |
| Screenshots for a product manual | Publish |
| Narrated walkthrough or feature demo | Demonstrate |
| Async standup update | Demonstrate |
| Send an ID or bank statement | Protect & share |
| Contract markup for review | Protect & share |
| Receipts for tax time | Extract |
| Table into a spreadsheet | Extract |
| Research clippings you'll want later | Remember |
| The settings screen you finally got right | Remember |

Each replaced page's scenario survives either as a recipe here or as the
framing of its type page (`knowledge-library` is broad enough that it
becomes the Remember page itself), so no existing phrasing is lost.

## Overview page

`/docs/workflows/`, sidebar label **Overview**. This page teaches
[the spine](#the-spine), so it is the longest of the set:

1. Intro — the guide is feature-first, these pages are job-first, and
   every job runs the same five stages.
2. The spine as a blockquote, with the note that only Capture is
   mandatory.
3. **One detailed section per stage** (`## 1. Capture` … `## 5. Deliver`),
   each covering the modes and features that belong to it and linking into
   `/docs/guide/*`. Encrypt explains that it is automatic and why it sits
   second; Refine splits into "what you do" and "what your Mac does";
   Organize splits into automatic and deliberate; Deliver enumerates the
   output forms, including "nothing at all."
4. `## Which workflow am I in?` — the self-selection test, then a table
   mapping each of the six types to the stages it leans on. This is the
   payoff: the spine explains the type set rather than decorating it.
5. Pointer to the recipes page.

Each type page's `## The loop` opens with an italic stage sequence linking
back to these anchors, so a reader who learns the five stages sees them
named on every page. Sequences are honest about deviation rather than
forced: Extract is `Capture → Organize → Refine → Deliver` (it files all
year and extracts at the end), and Remember is
`Capture → Encrypt → Organize` with no Deliver.

## Redirects

Added as a new `public/_redirects` file (Cloudflare Pages native format,
real 301s):

```
/docs/workflows/bug-reports/          /docs/workflows/explain/            301
```

…one line per row below. `_redirects` is used rather than Astro's
`redirects` config because this is a static build with no adapter, where
Astro emits meta-refresh HTML pages instead of true 301s — the wrong tool
for renamed URLs that already have search presence.

| From | To |
| --- | --- |
| `/docs/workflows/bug-reports/` | `/docs/workflows/explain/` |
| `/docs/workflows/documentation/` | `/docs/workflows/publish/` |
| `/docs/workflows/walkthrough-videos/` | `/docs/workflows/demonstrate/` |
| `/docs/workflows/sensitive-documents/` | `/docs/workflows/protect-and-share/` |
| `/docs/workflows/receipts-to-data/` | `/docs/workflows/extract/` |
| `/docs/workflows/knowledge-library/` | `/docs/workflows/remember/` |

Old URLs point at type pages rather than recipe anchors: the type page
carries the steps, and the mapping is 1:1, so nothing is lost.

Trailing slashes matter — Starlight serves these paths with a trailing
slash, so both forms should be listed or the rule written to match both.

## Files touched

**New:**

- `src/content/docs/docs/workflows/index.md`
- `src/content/docs/docs/workflows/explain.md`
- `src/content/docs/docs/workflows/publish.md`
- `src/content/docs/docs/workflows/demonstrate.md`
- `src/content/docs/docs/workflows/protect-and-share.md`
- `src/content/docs/docs/workflows/extract.md`
- `src/content/docs/docs/workflows/remember.md`
- `src/content/docs/docs/workflows/recipes.md`

**Deleted** (content migrated into the type pages above):

- `bug-reports.md`, `documentation.md`, `walkthrough-videos.md`,
  `sensitive-documents.md`, `receipts-to-data.md`,
  `knowledge-library.md`

- `public/_redirects`

**Modified:**

- `astro.config.mjs` — sidebar `Workflows` group rewritten to the eight
  new entries (overview, six types, recipes).
- `src/content/docs/docs/index.md` — the "Have a job to do?" bullet now
  names the six intents.
- `src/content/docs/docs/tips.md:81` — the Workflows link currently
  points at `bug-reports`; point it at `/docs/workflows/`.
- `src/pages/index.astro:191–214` — the three workflow cards keep their
  concrete scenario copy (it sells better than a one-word type) but
  point at type pages: Explain, Protect & share, Demonstrate.

## Content reuse

Every step above already exists in prose in the six current pages. The
work is regrouping and de-duplicating, not rewriting from scratch. All
existing screenshots keep their homes:

| Image | Lands on |
| --- | --- |
| `/manual/redaction-review.png` | Protect & share |
| `/manual/export-package.png` | Protect & share |
| `/manual/record-prompt.png` | Demonstrate |
| `/manual/extract-data.png` | Extract |
| `/manual/library-search.png` | Remember |

Explain has no image today and needs none; if one is wanted later, an
annotated-repro shot is the gap.

## Non-goals

- No new app features or screenshots required.
- No exposure/audience tagging layer (deferred; see "Why intent").
- No changes to `/docs/guide/*` — the type pages link into it as they do
  now.
- No `/docs/tips/` restructuring beyond the one stale link.

## Verification

- `npm run build` succeeds; no broken internal links in the new pages.
- Each of the six old URLs resolves to its type page.
- Sidebar shows Workflows → overview + six types + Recipes.
- Landing-page cards and `docs/index.md` links all resolve.
- No occurrence of the six old slugs remains outside the redirects map.
