#!/usr/bin/env python3
"""
Add a bookmarks pane (PDF outline) to the consolidated documentation PDF.

Chrome's own `generateDocumentOutline` infers a tree from heading levels, and
Paged.js restructures the DOM into per-page containers, so what it infers does
not reliably match the book's Part/Chapter shape. Instead print-book.mjs walks
the rendered table of contents and records the final page of every entry — which
Paged.js already knows, via `data-page-number` on each page container — and this
applies that list as a two-level outline.

Deriving from the TOC rather than from headings means the bookmarks and the
printed contents cannot disagree: they are the same list.

    python3 output/add-outline.py            # run automatically by print-book.mjs

Reads output/pdf/outline.json, rewrites output/pdf/sealshot-documentation.pdf in
place. Idempotent — any outline already present is replaced, not appended.
"""
import json
import pathlib
import sys

from pypdf import PdfReader, PdfWriter

HERE = pathlib.Path(__file__).resolve().parent
PDF = HERE / 'pdf' / 'sealshot-documentation.pdf'
DATA = HERE / 'pdf' / 'outline.json'


def main() -> int:
    if not PDF.exists():
        print(f'error: {PDF} not found — print the book first', file=sys.stderr)
        return 1
    if not DATA.exists():
        print(f'error: {DATA} not found — print-book.mjs writes it', file=sys.stderr)
        return 1

    entries = json.loads(DATA.read_text())
    if not entries:
        print('error: outline.json is empty; refusing to strip the outline',
              file=sys.stderr)
        return 1

    reader = PdfReader(str(PDF))
    total = len(reader.pages)

    # A page number past the end would raise deep inside pypdf with a confusing
    # message; catch it here where the cause is obvious.
    bad = [e for e in entries if not 1 <= e['page'] <= total]
    if bad:
        for e in bad:
            print(f'error: "{e["title"]}" claims page {e["page"]} of {total}',
                  file=sys.stderr)
        return 1

    writer = PdfWriter(clone_from=str(PDF))
    # clone_from copies any existing outline, which would double up on a re-run.
    writer._root_object.pop('/Outlines', None)
    writer._outline_item_cursor = None

    parents: dict[int, object] = {}
    counts = {'part': 0, 'chapter': 0}
    for e in entries:
        page_index = e['page'] - 1
        if e['level'] == 0:
            parents[0] = writer.add_outline_item(e['title'], page_index)
            counts['part'] += 1
        else:
            writer.add_outline_item(e['title'], page_index, parent=parents.get(0))
            counts['chapter'] += 1

    tmp = PDF.with_suffix('.pdf.tmp')
    with tmp.open('wb') as fh:
        writer.write(fh)
    tmp.replace(PDF)

    size = PDF.stat().st_size / 1024 / 1024
    print(f'  outline: {counts["part"]} top-level, {counts["chapter"]} nested, '
          f'{total} pages, {size:.1f} MB')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
