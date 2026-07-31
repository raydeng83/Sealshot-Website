// Verify every internal link + anchor across the built site.
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(DIST);

// url path -> set of element ids on that page
const anchors = new Map();
for (const p of pages) {
  const url = '/' + p.replace(/^dist\//, '').replace(/index\.html$/, '').replace(/\.html$/, '/');
  const html = readFileSync(p, 'utf8');
  anchors.set(url, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

// Check every page under /docs/, plus the marketing pages.
const targets = pages.filter(
  (p) => p.includes('/docs/') || p === 'dist/index.html' || p.includes('/support/') || p.includes('/buy/')
);

const SKIP_EXT = /\.(png|jpe?g|svg|xml|zip|dmg|ico|json|txt|css|js|webmanifest)$/;
let broken = 0;

for (const p of targets) {
  const from = '/' + p.replace(/^dist\//, '').replace(/index\.html$/, '');
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
    const [, path, hash] = m;
    if (SKIP_EXT.test(path)) continue;
    if (!anchors.has(path)) {
      console.log(`BROKEN PAGE    ${from} -> ${path}`);
      broken++;
      continue;
    }
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      if (!anchors.get(path).has(id)) {
        console.log(`BROKEN ANCHOR  ${from} -> ${path}${hash}`);
        broken++;
      }
    }
  }
}

console.log(
  broken === 0
    ? `OK — no broken internal links across ${targets.length} pages`
    : `${broken} broken link(s)`
);
