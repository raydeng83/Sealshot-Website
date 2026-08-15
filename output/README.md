# Consolidated documentation PDF

Regenerate `pdf/sealshot-documentation.pdf` from the built site:

1. `npm run build`
2. `python3 output/build-book.py`   — assembles dist/print/book.html from dist/.
   Stages its own assets now: downscales every `dist/manual/*.{png,jpg}` to
   1600px JPEG q82 into `dist/print/img/`, and downloads Paged.js if it is
   missing. Both live under `dist/`, which `npm run build` wipes, and both fail
   quietly — no polyfill means the sentinel never fires and the printer times
   out; no derivatives means the book loads full-size originals and the PDF
   balloons.
3. `python3 output/serve-dist.py &`  — serves dist on :8783
4. `node output/print-book.mjs`      — Google Chrome via playwright-core; waits for
   Paged.js's after-render sentinel so TOC page numbers are final, prints, then
   runs `add-outline.py` to attach the bookmarks pane (needs `pypdf`).

The bookmarks are derived from the **rendered** table of contents — each entry's
page comes from `data-page-number` on the Paged.js page container holding its
target — so the pane and the printed contents are the same list by construction.
Do not scope that query to `#contents`: Paged.js splits the contents list across
two pages and the id stays with the first fragment, which silently drops every
entry that overflowed (it cost four release-history chapters once). Select every
`ol.toc > li` instead.

Update the REVISIONS table in build-book.py (and the snapshot date / release
on the cover) before each new edition.

---

# Internal testing manual PDF

Regenerate `pdf/Sealshot-Testing-Manual.pdf` from `docs/testing-manual.md`:

1. `python3 output/build-testing-manual.py` — renders the Markdown, re-encodes
   every referenced screenshot into `print/img/` at 1260px, and wraps it in the
   print shell (cover, contents, page furniture).
2. `python3 output/serve-root.py &` — serves the **repo root** on :8783. Note
   this differs from `serve-dist.py`, which serves `dist/`; the manual is built
   outside `dist` so it survives `npm run build`.
3. `node output/print-testing-manual.mjs` — Chrome via playwright-core, waits
   for Paged.js's after-render sentinel, then prints.

The Markdown is the single source. Figures are ordinary
`![caption](/manual/x.jpg)`, so the document renders illustrated on GitHub and
could be published to the docs site unchanged; the alt text becomes the printed
caption.

Two traps, both of which cost a debugging cycle:

- **`window.PagedConfig` must be assigned before `paged.polyfill.js` loads**, or
  the `after` hook never registers and the sentinel never appears. The driver
  then times out with no explanation.
- **Heading ids must not start with a digit.** The sections here are numbered,
  and python-markdown slugs "1. What Sealshot is" to `1-what-sealshot-is`. A CSS
  id selector cannot begin with a digit, so Paged.js's `target-counter` calls
  `querySelector('#1-...')`, throws, and abandons pagination two pages in —
  silently, unless you are listening for `pageerror`. `build-testing-manual.py`
  prefixes every slug with `sec-`.

Bump `EDITION` in `build-testing-manual.py` for each new edition.

---

# Pricing / licensing and release-cycle docx

    python3 output/build-pricing-docx.py
    python3 output/build-release-cycle-docx.py

Both describe the **v1.0 published state**, not current implementation status —
deliberately, so they read as documentation rather than a progress report. Bump
the `Edition N · date` line whenever the substance changes.

Note these two use `space_after=` in their `rich()` helper, where the newer
generators (`build-gtm-docx.py`, `build-support-templates-docx.py`) use `after=`.
Worth knowing before copying a block between them.
