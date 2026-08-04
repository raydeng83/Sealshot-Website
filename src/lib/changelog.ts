/**
 * Where "the changelog" points.
 *
 * There is no `/docs/changelog/` index route — the group in the sidebar is
 * generated from the entry files — so anything linking to "the changelog" has to
 * name a specific version, and every hardcoded one rots at the next release.
 * It has already happened twice: the landing page was pinned to `v0-7-2` and
 * pointed at the wrong release the day 0.7.3 shipped, and both footer links were
 * still on `v0-4-0`, six releases behind, sending anyone curious about what is
 * new to the oldest notes on the site.
 *
 * Resolved at build time from the entry files themselves, so it cannot drift:
 * add `v0.7.4.md` and every link follows.
 */

/** Versions present in the changelog collection, newest first. */
export function changelogVersions(): string[] {
  return Object.keys(import.meta.glob('../content/docs/docs/changelog/*.md'))
    .map((path) => path.split('/').pop()!.replace(/^v|\.md$/g, ''))
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      return pb[0] - pa[0] || pb[1] - pa[1] || (pb[2] || 0) - (pa[2] || 0);
    });
}

/** Route of the newest changelog entry, e.g. `/docs/changelog/v0-7-3/`. */
export function latestChangelogHref(): string {
  const newest = changelogVersions()[0];
  if (!newest) throw new Error('no changelog entries found — a link would 404');
  return `/docs/changelog/v${newest.replace(/\./g, '-')}/`;
}
