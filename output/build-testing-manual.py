#!/usr/bin/env python3
"""
Build output/print/testing-manual.html from docs/testing-manual.md, ready for
Paged.js to paginate and Chrome to print.

The Markdown is the single source: figures are ordinary `![alt](/manual/x.jpg)`
so the document renders illustrated on GitHub and the docs site too, not only
here. This script only adds the print shell — cover, contents, page furniture.

Screenshots are re-encoded down to print width. The originals are already
web-sized (1440-1800px) but a 6.3in content column at 200dpi needs ~1260px, so
they go down again rather than bloating the PDF with pixels no printer uses.

Usage:
    python3 output/build-testing-manual.py
    python3 output/serve-dist.py &            # serves the repo root on :8783
    node output/print-testing-manual.mjs
"""
import pathlib
import re
import subprocess
import sys

import markdown
import markdown.extensions.toc

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / 'testing-manual.md'
OUT_DIR = ROOT / 'output' / 'print'
IMG_DIR = OUT_DIR / 'img'
TITLE = 'Sealshot — Internal Testing Manual'
SUBTITLE = 'Pre-1.0 release · for internal testers'
EDITION = 'Edition 1 · 2 August 2026'

# Print width: the 174mm (6.85in) content column at ~215dpi.
PRINT_PX = 1500


def build_images(md: str) -> str:
    """Copy every referenced screenshot into print/img at print resolution."""
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    for ref in sorted(set(re.findall(r'\]\((/manual/[^)]+)\)', md))):
        src = ROOT / 'public' / ref.lstrip('/')
        if not src.exists():
            sys.exit(f'missing screenshot: {src}')
        dst = IMG_DIR / (src.stem + '.jpg')
        # sips handles both .png and .jpg sources and never upscales with -Z.
        subprocess.run(
            ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '86',
             '-Z', str(PRINT_PX), str(src), '--out', str(dst)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        md = md.replace(ref, f'img/{dst.name}')
    return md


def strip_front_matter(md: str) -> tuple[str, str]:
    """Split the H1 off so it can become the cover instead of a body heading."""
    lines = md.split('\n')
    assert lines[0].startswith('# ')
    return lines[0][2:].strip(), '\n'.join(lines[1:]).lstrip('\n')


CSS = """
@page {
  size: A4;
  margin: 20mm 18mm 22mm;
  @bottom-center {
    content: counter(page);
    font: 9pt/1 -apple-system, system-ui, sans-serif;
    color: #7e8aa0;
  }
}
/* No page number or running head on the cover. */
@page cover { margin: 0; @bottom-center { content: none; } }

:root {
  --ink: #0b1220;
  --muted: #4f5a72;
  --accent: #c2410c;
  --rule: #dbe3ee;
  --tint: #f4fbf8;
}

body {
  font: 9.5pt/1.5 -apple-system, system-ui, 'Helvetica Neue', sans-serif;
  color: var(--ink);
  margin: 0;
  hyphens: none;
}

/* ── Cover ───────────────────────────────────────────────────────────────── */
.cover {
  page: cover;
  break-after: page;
  height: 297mm;
  padding: 55mm 22mm 22mm;
  box-sizing: border-box;
  background: var(--tint);
}
.cover h1 {
  font-size: 27pt; line-height: 1.15; margin: 0 0 6mm; letter-spacing: -0.4pt;
}
.cover .sub { font-size: 12pt; color: var(--accent); font-weight: 600; margin: 0 0 3mm; }
.cover .edition { font-size: 9.5pt; color: var(--muted); margin: 0; }
.cover .note {
  margin-top: 60mm; padding-top: 5mm; border-top: 2px solid var(--accent);
  font-size: 9pt; color: var(--muted); max-width: 120mm;
}

/* ── Contents ────────────────────────────────────────────────────────────── */
.toc { break-after: page; }
.toc h2 { font-size: 14pt; margin: 0 0 6mm; }
.toc ol { list-style: none; padding: 0; margin: 0; }
.toc li { margin: 0 0 1.4mm; font-size: 9.5pt; }
.toc li.sub { padding-left: 8mm; font-size: 8.5pt; color: var(--muted); }
.toc a { text-decoration: none; color: inherit; }
/* Paged.js resolves the target's page number into this counter. */
.toc a::after {
  content: target-counter(attr(href), page);
  float: right; color: var(--muted); font-variant-numeric: tabular-nums;
}

/* ── Body ────────────────────────────────────────────────────────────────── */
h2 {
  font-size: 14pt; margin: 0 0 4mm; padding-bottom: 2mm;
  border-bottom: 2px solid var(--accent); break-before: page; break-after: avoid;
}
h2:first-of-type { break-before: avoid; }
h3 {
  font-size: 10.5pt; margin: 7mm 0 2mm; color: var(--accent);
  break-after: avoid;
}
p { margin: 0 0 3mm; orphans: 3; widows: 3; }
strong { font-weight: 700; }
a { color: var(--ink); text-decoration: none; }

ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
li { margin-bottom: 1.2mm; }

hr { display: none; }        /* section rules come from the h2 border */

/* A lead-in line must not be stranded at the foot of a page, cut off from the
   table or figure it introduces. Keeping them together costs a little
   whitespace and saves the reader turning back a page to see what they are
   looking at. */
p:not(:has(> img)):has(+ table),
p:not(:has(> img)):has(+ p > img:only-child),
p:not(:has(> img)):has(+ pre),
p:not(:has(> img)):has(+ ul),
p:not(:has(> img)):has(+ ol) { break-after: avoid; }

code {
  font: 8pt/1.4 ui-monospace, Menlo, monospace;
  background: #f1f4f9; padding: 0.5mm 1.2mm; border-radius: 1mm;
}
pre {
  background: #f1f4f9; border-left: 2.5pt solid var(--rule);
  padding: 3mm 4mm; margin: 0 0 4mm; break-inside: avoid;
}
pre code { background: none; padding: 0; font-size: 7.5pt; }

table {
  width: 100%; border-collapse: collapse; margin: 0 0 4mm;
  font-size: 8.5pt;
}
/* Repeat the header on a continued table. Paged.js only honours
   break-inside: avoid when the whole table fits somewhere, so a long one splits
   regardless — better that it splits with its header than without. */
thead { display: table-header-group; }
tr { break-inside: avoid; }
th {
  text-align: left; background: #f1f4f9; font-weight: 700;
  border: 0.5pt solid var(--rule); padding: 1.6mm 2.2mm;
}
td { border: 0.5pt solid var(--rule); padding: 1.6mm 2.2mm; vertical-align: top; }

/* ── Figures ─────────────────────────────────────────────────────────────── */
/* Markdown puts a lone image in its own <p>; that <p> IS the figure. */
p > img:only-child { display: block; margin-left: auto; margin-right: auto; }
p:has(> img:only-child) {
  break-inside: avoid; margin: 3.5mm 0 4.5mm; text-align: center;
}
img {
  max-width: 100%; max-height: 105mm; height: auto;
  border: 0.5pt solid var(--rule); border-radius: 1.5mm;
}
/* The alt text becomes the visible caption, so a figure never needs a second
   description written for print only. */
p:has(> img:only-child)::after {
  content: attr(data-caption);
  display: block; margin-top: 1.8mm;
  font-size: 8pt; color: var(--muted); text-align: center;
  max-width: 130mm; margin-left: auto; margin-right: auto;
}

blockquote {
  margin: 0 0 4mm; padding: 3mm 4mm; background: var(--tint);
  border-left: 2.5pt solid var(--accent); break-inside: avoid;
}
blockquote p:last-child { margin-bottom: 0; }
"""

JS = """
// Lift each image's alt text onto its wrapper so CSS can print it as a caption.
// Runs before paged.polyfill.js is fetched, so the attribute exists on the
// source DOM that Paged.js clones into pages.
for (const img of document.querySelectorAll('p > img:only-child')) {
  if (img.alt) img.parentElement.setAttribute('data-caption', img.alt);
}

// Signal for the PDF driver. Paged.js calls `after` once every page AND every
// target-counter cross-reference is final — the contents page numbers are
// zeroed if the PDF is taken before this. Must be assigned BEFORE the polyfill
// loads, or the hook is never registered.
window.PagedConfig = {
  after: () => { document.documentElement.dataset.pagedDone = '1'; },
};
"""


def main() -> None:
    md_raw = SRC.read_text(encoding='utf-8')
    md_raw = build_images(md_raw)
    _, body_md = strip_front_matter(md_raw)

    # Headings here are numbered ("1. What Sealshot is"), which the default
    # slugifier turns into ids like `1-what-sealshot-is`. A CSS id selector
    # cannot start with a digit, so Paged.js's target-counter does
    # querySelector('#1-what-...'), throws, and abandons pagination two pages
    # in — with no error unless you are listening for pageerror. Prefix every
    # slug so it always begins with a letter.
    def slugify(value: str, separator: str) -> str:
        return 'sec-' + markdown.extensions.toc.slugify(value, separator)

    html = markdown.markdown(
        body_md, extensions=['tables', 'fenced_code', 'attr_list', 'toc'],
        extension_configs={'toc': {'permalink': False, 'slugify': slugify}})

    # Section ids for the contents. markdown's toc extension already slugged the
    # headings, so read them back out of the rendered HTML.
    headings = re.findall(r'<h([23]) id="([^"]+)">(.*?)</h[23]>', html, re.S)
    toc_items = []
    for level, hid, text in headings:
        label = re.sub(r'<[^>]+>', '', text).strip()
        cls = '' if level == '2' else ' class="sub"'
        toc_items.append(f'<li{cls}><a href="#{hid}">{label}</a></li>')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / 'testing-manual.html').write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>{TITLE}</title>
<link rel="icon" href="data:,">
<style>{CSS}</style>
</head><body>

<section class="cover">
  <h1>{TITLE.replace(' — ', '<br>')}</h1>
  <p class="sub">{SUBTITLE}</p>
  <p class="edition">{EDITION}</p>
  <p class="note">
    Not a list of test cases. Sixteen detailed case workbooks already exist;
    this is the route through them — what the app is, what to spend your time
    on, and the order to do it in.
  </p>
</section>

<nav class="toc">
  <h2 style="break-before:avoid;border:0">Contents</h2>
  <ol>{''.join(toc_items)}</ol>
</nav>

{html}

<script>{JS}</script>
<script src="paged.polyfill.js"></script>
</body></html>
""", encoding='utf-8')

    if not (OUT_DIR / 'paged.polyfill.js').exists():
        sys.exit('paged.polyfill.js missing — re-download it into output/print/ '
                 'from https://unpkg.com/pagedjs/dist/paged.polyfill.js')
    imgs = len(list(IMG_DIR.glob('*.jpg')))
    print(f'wrote {OUT_DIR / "testing-manual.html"}')
    print(f'  {len(headings)} headings, {imgs} figures at {PRINT_PX}px')


if __name__ == '__main__':
    main()
