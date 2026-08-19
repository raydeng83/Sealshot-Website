/**
 * The sitemap must not advertise a page that tells crawlers not to index it.
 *
 * The two lists live apart and cannot see each other: `noindex` is a prop on a
 * page, the exclusion is a NOINDEX array in astro.config.mjs. Add a third
 * noindex page and nothing complains — the sitemap simply starts inviting
 * crawlers to a page that refuses them, which Search Console reports as a fault
 * for as long as it is listed. This test is the thing that complains.
 *
 * Reads the build output, so it needs `npm run build` first and skips when dist
 * is absent rather than failing for the wrong reason.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const built = existsSync(DIST) && existsSync(join(DIST, 'sitemap-0.xml'));

/** Every built page that asks not to be indexed, as a site-root path. */
function noindexPaths(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === 'index.html') {
        const html = readFileSync(full, 'utf8');
        // The meta tag Astro emits for the layout's `noindex` prop.
        if (/<meta name="robots" content="noindex/.test(html)) {
          const path = '/' + relative(DIST, full).replace(/index\.html$/, '');
          out.push(path);
        }
      }
    }
  };
  walk(DIST);
  return out.sort();
}

function sitemapPaths(): string[] {
  const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    .sort();
}

describe.skipIf(!built)('sitemap', () => {
  it('lists no page that carries noindex', () => {
    const noindex = noindexPaths();
    // Guard the guard: if the meta tag ever changes shape this finds nothing and
    // the assertion below passes vacuously.
    expect(noindex.length).toBeGreaterThan(0);
    expect(sitemapPaths().filter((p) => noindex.includes(p))).toEqual([]);
  });

  it('still lists the pages that matter', () => {
    const paths = sitemapPaths();
    for (const p of ['/', '/buy/', '/download/', '/compare/', '/renew/', '/docs/faq/']) {
      expect(paths).toContain(p);
    }
  });
});
