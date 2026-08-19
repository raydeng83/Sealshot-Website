/**
 * The support form's Type options must match the Worker's TYPES list.
 *
 * They live in different packages and neither imports the other: the page is
 * Astro markup, the list is a const in the Worker. The Worker flattens anything
 * it does not recognise to 'General feedback' — so an option added to the page
 * alone still submits, still emails, and still looks fine, while quietly losing
 * the distinction it was added to make. Nothing else would catch that.
 *
 * Reads the build output, so it needs `npm run build` first and skips when dist
 * is absent rather than failing for the wrong reason.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const PAGE = new URL('../dist/support/index.html', import.meta.url).pathname;
const WORKER = new URL('../workers/license-fulfillment/src/feedback.ts', import.meta.url).pathname;
const built = existsSync(PAGE);

/** The `<option>` values the form offers, minus the disabled placeholder. */
function pageTypes(): string[] {
  const html = readFileSync(PAGE, 'utf8');
  const select = /<select[^>]*name="type"[^>]*>([\s\S]*?)<\/select>/.exec(html)?.[1] ?? '';
  return [...select.matchAll(/<option(?![^>]*disabled)[^>]*>([^<]*)<\/option>/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
}

/** The TYPES array in the Worker, read as source rather than imported: the site
 *  suite has no build step for Worker code. */
function workerTypes(): string[] {
  const src = readFileSync(WORKER, 'utf8');
  const block = /const TYPES = \[([\s\S]*?)\];/.exec(src)?.[1] ?? '';
  return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe.skipIf(!built)('support form types', () => {
  it('offers exactly what the Worker accepts, in the same order', () => {
    const page = pageTypes();
    // Guard the guard: a regex that matches nothing would pass vacuously.
    expect(page.length).toBeGreaterThan(3);
    expect(page).toEqual(workerTypes());
  });

  it('keeps General feedback, which is also the fallback', () => {
    expect(workerTypes()).toContain('General feedback');
  });
});
