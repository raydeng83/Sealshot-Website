#!/usr/bin/env python3
"""Assemble the consolidated Sealshot documentation book from dist/ into one
print-ready HTML (Paged.js), for Chrome headless -> PDF."""
import re, html, pathlib, datetime

ROOT = pathlib.Path('/Users/ledeng/projects/Sealshot-Website')
DIST = ROOT / 'dist'
OUT = DIST / 'print'
OUT.mkdir(exist_ok=True)

SECTIONS = [
    ('Core guide', [
        'docs/guide/getting-started', 'docs/guide/capture', 'docs/guide/recording',
        'docs/guide/editor', 'docs/guide/redaction', 'docs/guide/ai',
        'docs/guide/library', 'docs/guide/sharing', 'docs/guide/security',
        'docs/guide/settings', 'docs/guide/shortcuts', 'docs/guide/seal-format',
    ]),
    ('Workflows', [
        'docs/workflows', 'docs/workflows/explain', 'docs/workflows/publish',
        'docs/workflows/demonstrate', 'docs/workflows/protect-and-share',
        'docs/workflows/extract', 'docs/workflows/recipes',
    ]),
    ('Tips & tricks', [
        'docs/tips', 'docs/tips/capture', 'docs/tips/encrypt',
        'docs/tips/refine', 'docs/tips/organize', 'docs/tips/deliver',
    ]),
    ('Reference', ['docs/faq']),
    ('Release history', [
        'docs/changelog/v0-7-0', 'docs/changelog/v0-6-0', 'docs/changelog/v0-5-1',
        'docs/changelog/v0-5-0', 'docs/changelog/v0-4-0',
    ]),
]

REVISIONS = [
    ('Jun 11–13, 2026', 'Initial website documentation: core guide pages, FAQ, and release history.'),
    ('Jul 16, 2026', 'Docs synced to Sealshot 0.7.0 — recording, on-device AI, sharing, library, multi-monitor, and editor coverage; release-notes pipeline established.'),
    ('Jul 17–18, 2026', 'FAQ expanded to 19 questions; Intel / Apple Silicon support documented; trash retention, Extract redesign, and redaction updates.'),
    ('Jul 22, 2026', 'First consolidated PDF edition (snapshot of release 0.7.0).'),
    ('Jul 25, 2026', 'Workflows reorganized around intent — Explain, Publish, Demonstrate, Protect & share, Extract — under the five-stage spine (Capture → Encrypt → Refine → Organize → Deliver), with an examples page.'),
    ('Jul 28, 2026', 'Tips & tricks split into five stage pages and grown from 19 to 65 tips; capture docs gain ⌘-adjustable selection; boundary-detection behavior corrected to app scale.'),
    ('Jul 29, 2026', 'Guide audited against the app: editor page catches up (Find in Image, blank canvas, focus area vs. the Crop tool), the On-device AI page takes over text recognition and image enhancement, sharing documents enforced expiry and bulk exports, Settings documented per control including the License tab. Second consolidated PDF edition.'),
]

def extract(slug):
    p = DIST / slug / 'index.html'
    src = p.read_text()
    title = html.unescape(re.search(r'<h1[^>]*>(.*?)</h1>', src).group(1))
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', src)
    desc = html.unescape(desc_m.group(1)) if desc_m else ''
    start = src.index('sl-markdown-content')
    start = src.rindex('<div', 0, start)
    depth, i = 0, start
    for m in re.finditer(r'<div\b|</div>', src[start:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            i = start + m.end()
            break
    body = src[start:i]
    body = re.sub(r'<nav class="spine.*?</nav>', '', body, flags=re.S)      # SpineRail: nav, not content
    body = re.sub(r'\s(?:id|data-footnote-ref)="[^"]*"', '', body)          # avoid duplicate ids across pages
    body = re.sub(r'<a class="sl-anchor-link".*?</a>', '', body, flags=re.S)
    def fix_href(m):
        url = m.group(1)
        pg = re.match(r'/(docs/[a-z0-9/-]+?)/?(#[^"]*)?$', url)
        if pg and any(pg.group(1) == s for _, ss in SECTIONS for s in ss):
            return f'href="#pg-{pg.group(1).replace("/", "-")}"'
        if url.startswith('/'):
            return 'href="https://seal-shot.com' + url + '"'
        return m.group(0)
    body = re.sub(r'href="([^"]+)"', fix_href, body)
    # print edition uses the downscaled JPEGs in /print/img
    body = re.sub(r'src="/manual/([a-z0-9._-]+)\.png"', r'src="/print/img/\1.jpg"', body)
    return title, desc, body

today = 'July 29, 2026'
toc, chapters = [], []
for sec_title, slugs in SECTIONS:
    sec_id = 'sec-' + re.sub(r'[^a-z]+', '-', sec_title.lower())
    toc.append(f'<li class="toc-sec"><a href="#{sec_id}">{sec_title}</a></li>')
    first = True
    for slug in slugs:
        title, desc, body = extract(slug)
        pid = 'pg-' + slug.replace('/', '-')
        toc.append(f'<li class="toc-pg"><a href="#{pid}">{html.escape(title)}</a></li>')
        anchor = f'<span id="{sec_id}"></span>' if first else ''
        chapters.append(
            f'<section class="chapter" id="{pid}">{anchor}'
            f'<h1 class="ch-title">{html.escape(title)}</h1>'
            f'<p class="ch-desc">{html.escape(desc)}</p>{body}</section>')
        first = False

rev_rows = ''.join(f'<tr><td class="rev-date">{d}</td><td>{s}</td></tr>' for d, s in REVISIONS)

page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Sealshot — Consolidated Documentation</title>
<style>
  :root {{ --ink:#0e1524; --muted:#4f5a72; --faint:#7f8aa1; --accent:#c2410c;
           --line:#e2e6ee; --soft:#f4f6f9;
           --sans:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;
           --mono:ui-monospace,"SF Mono",Menlo,monospace; }}
  @page {{ size: letter; margin: 22mm 18mm 20mm;
    @top-left {{ content: "SEALSHOT"; font: 700 8px var(--sans); letter-spacing:.08em; color:#c2410c; }}
    @top-right {{ content: "CONSOLIDATED DOCUMENTATION"; font: 8px var(--sans); letter-spacing:.06em; color:#7f8aa1; }}
    @bottom-left {{ content: "seal-shot.com | Privacy-first screen capture for macOS"; font: 8px var(--sans); color:#7f8aa1; }}
    @bottom-right {{ content: counter(page); font: 8px var(--sans); color:#7f8aa1; }}
  }}
  @page cover {{ @top-left {{content:none}} @top-right {{content:none}} @bottom-left {{content:none}} @bottom-right {{content:none}} }}
  * {{ box-sizing: border-box; }}
  body {{ font: 10.5px/1.55 var(--sans); color: var(--ink); margin: 0; }}
  a {{ color: var(--accent); text-decoration: none; }}
  img {{ max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; }}
  code {{ font: 9.5px var(--mono); background: var(--soft); padding: 1px 4px; border-radius: 3px; }}
  kbd {{ font: 9.5px var(--mono); background: var(--soft); border:1px solid var(--line); border-bottom-width:2px; border-radius:3px; padding:0 4px; }}
  table {{ border-collapse: collapse; width: 100%; margin: 8px 0; }}
  th, td {{ border: 1px solid var(--line); padding: 5px 8px; text-align: left; vertical-align: top; }}
  th {{ background: var(--soft); }}
  tr, img, li {{ break-inside: avoid; }}
  h2, h3 {{ break-after: avoid; }}
  blockquote {{ margin: 8px 0; padding: 6px 12px; border-left: 3px solid var(--accent); background: var(--soft); }}
  .starlight-aside {{ border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 6px;
    padding: 8px 12px; margin: 10px 0; background: #fbeae0; break-inside: avoid; }}
  .starlight-aside--note {{ background:#e8eef8; border-left-color:#3b6ea5; }}
  .starlight-aside--tip {{ background:#e0f0e8; border-left-color:#2f7d5b; }}
  .starlight-aside__title {{ font-weight: 700; font-size: 10px; margin-bottom: 3px; display:flex; gap:4px; align-items:center; }}
  .starlight-aside__title svg {{ width: 11px; height: 11px; }}
  .cover {{ page: cover; text-align: center; padding-top: 140px; }}
  .cover img {{ width: 76px; border: 0; }}
  .cover .kicker {{ color: var(--accent); font-weight: 700; font-size: 10px; letter-spacing: .1em; margin-top: 42px; }}
  .cover h1 {{ font-size: 40px; margin: 8px 0 6px; }}
  .cover .sub {{ font-size: 15px; color: var(--muted); }}
  .cover .rule {{ width: 250px; height: 5px; background: var(--accent); border-radius: 3px; margin: 26px auto; }}
  .cover .meta {{ color: var(--faint); font-size: 10px; line-height: 1.7; }}
  .cover .blurb {{ max-width: 430px; margin: 40px auto 0; color: var(--muted); font-size: 11.5px; }}
  .front h1 {{ font-size: 26px; margin: 0 0 4px; }}
  .front .lede {{ color: var(--muted); font-size: 11.5px; margin: 0 0 10px; }}
  .front .rule {{ height: 4px; background: var(--accent); border-radius: 2px; margin-bottom: 18px; }}
  .rev-table td {{ font-size: 10px; }}
  .rev-date {{ white-space: nowrap; font-weight: 600; width: 110px; }}
  section.chapter, section.front {{ break-before: page; }}
  .ch-title {{ font-size: 22px; margin: 0 0 2px; }}
  .ch-desc {{ color: var(--muted); font-size: 11px; margin: 0 0 6px; border-bottom: 3px solid var(--accent); padding-bottom: 10px; }}
  ol.toc {{ list-style: none; padding: 0; margin: 14px 0 0; }}
  .toc-sec {{ font-weight: 700; font-size: 11.5px; margin: 12px 0 4px; }}
  .toc-sec a {{ color: var(--ink); }}
  .toc-pg {{ margin: 2px 0 2px 14px; font-size: 10.5px; }}
  .toc-pg a, .toc-sec a {{ display: flex; }}
  .toc-pg a::after, .toc-sec a::after {{ content: target-counter(attr(href), page);
    margin-left: auto; color: var(--faint); }}
  .toc-pg a {{ color: var(--muted); }}
  .qr th {{ width: 130px; }}
</style>
<script>
  // Signal for the PDF driver: Paged.js fires afterRendered when every page
  // (and every cross-reference page number) is final.
  window.PagedConfig = {{ after: () => {{ document.documentElement.dataset.pagedDone = '1'; }} }};
</script>
<script src="/print/paged.polyfill.js"></script>
</head><body>

<div class="cover">
  <img src="/favicon.png" alt="Sealshot">
  <div class="kicker">CONSOLIDATED DOCUMENTATION</div>
  <h1>Sealshot User Guide</h1>
  <div class="sub">Capture, edit, redact, organize, and share — privately on your Mac.</div>
  <div class="rule"></div>
  <div class="meta">Guide + workflows + tips + FAQ + release history<br>
  Documentation snapshot: {today} | Current release: 0.7.2</div>
  <div class="blurb">Sealshot is a privacy-first screenshot and screen-recording app for macOS.
  Capture, OCR, redaction, AI metadata, and search all run on the device.</div>
</div>

<section class="front" id="revision-history">
  <h1>Revision history</h1>
  <p class="lede">How this documentation has evolved, edition to edition.</p>
  <div class="rule"></div>
  <table class="rev-table"><tr><th>Date</th><th>Changes</th></tr>{rev_rows}</table>
</section>

<section class="front" id="contents">
  <h1>Contents</h1>
  <p class="lede">A single, offline-friendly edition of the Sealshot website documentation.</p>
  <div class="rule"></div>
  <ol class="toc">
    <li class="toc-sec"><a href="#quick-reference">Quick reference</a></li>
    {''.join(toc)}
  </ol>
</section>

<section class="front" id="quick-reference">
  <h1>Quick reference</h1>
  <p class="lede">The essentials for installing, using, and sharing with Sealshot. Full explanations follow in the guide.</p>
  <div class="rule"></div>
  <table class="qr">
    <tr><th>System</th><td>macOS 14 (Sonoma) or later; Apple Silicon and Intel</td></tr>
    <tr><th>Privacy</th><td>Capture, recording, OCR, redaction, AI metadata, and search run locally</td></tr>
    <tr><th>Storage</th><td>Settings → General → Save location; default ~/Pictures/Sealshot</td></tr>
    <tr><th>Native file</th><td>.seal keeps originals, annotations, metadata, OCR, and extraction results editable</td></tr>
    <tr><th>Secure sharing</th><td>.sealshare supports passcode encryption, expiry, hint, and recipient note</td></tr>
    <tr><th>Plain export</th><td>PNG for images; MOV or MP4 for video; ZIP for broadly compatible packages</td></tr>
  </table>
  <h2>Primary global shortcuts</h2>
  <table>
    <tr><td>Smart Capture</td><td><code>Cmd+Shift+C</code></td></tr>
    <tr><td>Delayed capture</td><td><code>Cmd+Shift+D</code></td></tr>
    <tr><td>Scrolling capture</td><td><code>Cmd+Shift+W</code></td></tr>
    <tr><td>Live Capture</td><td><code>Cmd+Shift+X</code></td></tr>
    <tr><td>Record screen</td><td><code>Cmd+Shift+V</code></td></tr>
    <tr><td>Record selection</td><td><code>Cmd+Shift+R</code></td></tr>
    <tr><td>Open Library</td><td><code>Cmd+Shift+B</code></td></tr>
    <tr><td>Lock now</td><td><code>Cmd+Shift+L</code></td></tr>
  </table>
  <div class="starlight-aside"><div class="starlight-aside__title">Recovery codes and sharing passcodes</div>
  There is no account or cloud recovery. Store your Enhanced Security recovery code safely, and send a
  package passcode through a different channel than the package itself.</div>
</section>

{''.join(chapters)}
</body></html>"""

(OUT / 'book.html').write_text(page)
print('wrote', OUT / 'book.html', len(page), 'bytes,', len(chapters), 'chapters')
