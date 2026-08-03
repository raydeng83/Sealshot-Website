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
await page.pdf({
  path: '/Users/ledeng/projects/Sealshot-Website/output/pdf/sealshot-documentation.pdf',
  preferCSSPageSize: true,
  printBackground: true,
});
await browser.close();
console.log('pdf written');
