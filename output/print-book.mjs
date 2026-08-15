import { chromium } from '/Users/ledeng/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
await page.goto('http://localhost:8783/print/book.html', { waitUntil: 'networkidle', timeout: 120_000 });
// Paged.js sets data-paged-done="1" from its `after` hook, when pagination
// AND cross-reference page numbers are final.
await page.waitForSelector('html[data-paged-done="1"]', { timeout: 600_000 });
const pages = await page.evaluate(() => document.querySelectorAll('.pagedjs_page').length);
console.log('paged.js rendered', pages, 'pages');

// Outline data for the bookmarks pane. Walked from the rendered table of
// contents rather than from headings, so the bookmarks and the printed contents
// are literally the same list and cannot drift apart. Paged.js has already
// resolved which page each target landed on — that is what data-page-number on
// the page container holds.
const outline = await page.evaluate(() => {
  const pageOf = (id) => {
    // Paged.js can duplicate ids when it splits an element across pages; the
    // first occurrence is where the section actually starts.
    const el = document.querySelector(`[id="${CSS.escape(id)}"]`);
    const container = el && el.closest('.pagedjs_page');
    const n = container && container.getAttribute('data-page-number');
    return n ? Number(n) : null;
  };
  const out = [];
  // NOT scoped to #contents: Paged.js splits the contents list across two pages
  // and the id stays with the first fragment, so scoping there silently dropped
  // every entry that overflowed onto the following page — four release-history
  // chapters, with no error. Selecting every ol.toc fragment in document order
  // survives the split however the list happens to break.
  for (const li of document.querySelectorAll('ol.toc > li')) {
    const a = li.querySelector('a[href^="#"]');
    if (!a) continue;
    const page = pageOf(a.getAttribute('href').slice(1));
    if (page === null) continue;
    out.push({
      level: li.classList.contains('toc-sec') ? 0 : 1,
      title: a.textContent.trim(),
      page,
    });
  }
  return out;
});
console.log('outline entries:', outline.length);

const OUT = '/Users/ledeng/projects/Sealshot-Website/output/pdf';
await page.pdf({
  path: `${OUT}/sealshot-documentation.pdf`,
  preferCSSPageSize: true,
  printBackground: true,
});
await browser.close();
console.log('pdf written');

const { writeFileSync } = await import('node:fs');
writeFileSync(`${OUT}/outline.json`, JSON.stringify(outline, null, 1));

// Applied here so `node output/print-book.mjs` stays the last step of the recipe.
const { execFileSync } = await import('node:child_process');
execFileSync('python3', ['/Users/ledeng/projects/Sealshot-Website/output/add-outline.py'],
             { stdio: 'inherit' });
