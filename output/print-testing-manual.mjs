import { chromium } from '/Users/ledeng/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

// Chrome's --virtual-time-budget is NOT usable here: it fires mid-pagination and
// produces zeroed contents page numbers. Wait for Paged.js's own after-render
// sentinel instead, which is set only once pagination AND cross-references are
// final. Same lesson as the documentation book.
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

await page.goto('http://localhost:8783/output/print/testing-manual.html', {
  waitUntil: 'networkidle', timeout: 120_000,
});
await page.waitForSelector('html[data-paged-done="1"]', { timeout: 600_000 });

const stats = await page.evaluate(() => ({
  pages: document.querySelectorAll('.pagedjs_page').length,
  figures: document.querySelectorAll('img').length,
  // A contents row that resolved to nothing means target-counter failed.
  emptyTocRows: [...document.querySelectorAll('.toc a')]
    .filter((a) => !getComputedStyle(a, '::after').content.match(/\d/)).length,
}));
console.log(`paged.js rendered ${stats.pages} pages, ${stats.figures} figures`);
if (stats.emptyTocRows) console.error(`⚠ ${stats.emptyTocRows} contents rows have no page number`);

await page.pdf({
  path: '/Users/ledeng/projects/Sealshot-Website/output/pdf/Sealshot-Testing-Manual.pdf',
  preferCSSPageSize: true,
  printBackground: true,
});
await browser.close();
console.log('pdf written');
