# Sealshot Website — Marketing & Documentation Platform

**Date:** 2026-06-11
**Status:** Approved
**Repo:** Sealshot-Website (this repo, currently empty)

## Purpose

A public website at **seal-shot.com** serving as the marketing and
documentation platform for Sealshot, the privacy-first Mac screenshot app
(macOS 14+). It markets the app, hosts user documentation, links downloads,
collects user feedback, and builds a marketing email list.

Related repos:

- `sealshot` (private) — app source; its release tooling lives in `scripts/`
- `Sealshot-Release` (public) — Sparkle `appcast.xml` + per-version DMG/zip
  release assets on GitHub Releases

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Astro | Static output, zero JS by default, full design freedom for marketing pages |
| Docs | Starlight (Astro integration) | Sidebar nav, Pagefind full-text search, dark mode, mobile layout — all built in |
| Hosting | Cloudflare Pages | Free tier, git-push deploys, custom domain seal-shot.com with SSL |
| Feedback form | Web3Forms | Free form endpoint; submissions delivered to email; honeypot spam protection |
| Newsletter | Kit (ConvertKit) | Embedded signup form; free to 10,000 subscribers; double opt-in |

Everything is free / open-source; the only recurring cost is the domain.
The site is purely static — no servers, no databases, no Pages Functions.

## Site structure

```
src/
  pages/
    index.astro     ← landing: hero, feature sections, screenshots, download CTA,
                      newsletter signup section
    download.astro  ← Direct DMG download + Mac App Store badge
    privacy.astro   ← privacy policy (App Store requirement + brand selling point);
                      covers feedback-form and newsletter data handling
    support.astro   ← feedback form (Web3Forms)
  content/docs/     ← Starlight content, served at /docs
    guide/          ← user guide: capture modes, editor, library, .seal format
    faq.md          ← FAQ + troubleshooting; links to /support as escalation path
    changelog/      ← one Markdown file per release (v0.4.0.md, …)
  components/       ← shared header/footer so marketing + docs feel like one site
  assets/           ← app icon (from sealshot repo), screenshots, og-image
```

## Key behaviors

**Marketing pages.** Custom-designed around the privacy-first angle
("no account, no telemetry, no cloud") and the visual features (annotation,
redaction, scrolling capture). App screenshots/recordings are the hero
content; launch with placeholders, replace with real captures.

**Docs.** Plain Markdown under `src/content/docs/`. Starlight theme
customized to match the marketing brand.

**Downloads.** Release assets in Sealshot-Release are version-named
(e.g. `Sealshot-0.4.0.dmg`), so there is no stable direct URL. The download
button uses a tiny client-side fetch of
`api.github.com/repos/raydeng83/Sealshot-Release/releases/latest` to resolve
the current DMG asset URL, with a plain link to the GitHub releases page as
no-JS fallback. This keeps downloads current without rebuilding the site on
each app release. A Mac App Store badge sits alongside. Changelog entries
are authored here per release; later, the release script in
`sealshot/scripts` can append them automatically when it updates the
appcast (out of scope for this build).

**Feedback form** (`/support`). Fields: name (optional), email (optional),
feedback type (bug / feature request / general), message. Posts to a
Web3Forms endpoint; submissions arrive by email. Honeypot field for spam.
A short note explains what happens to submitted data. Linked from the site
footer and the docs sidebar.

**Newsletter signup.** Kit embedded form ("Get Sealshot updates — new
features, releases, tips") in two placements: a landing-page section and
the site footer. Double opt-in. Privacy page states the address is used
only for product updates and never shared.

**Deployment.** Cloudflare Pages connected to this repo's GitHub remote.
Push to `main` → build → live at seal-shot.com.

## Out of scope (deferred, no restructuring needed later)

- Payments / license keys for the Direct build
- Analytics (would use a privacy-friendly option like Cloudflare Web
  Analytics if added)
- Blog
- Automated changelog sync from the release script

## Success criteria

- Site builds statically and deploys on Cloudflare Pages at seal-shot.com
- Landing page presents the product with download CTA and newsletter signup
- `/docs` has working search, navigation, user guide skeleton, FAQ, and a
  v0.4.0 changelog entry
- Download button resolves and serves the latest Sealshot-Release DMG
- Feedback form delivers submissions to email
- Newsletter form subscribes an address through Kit with double opt-in
