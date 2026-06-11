# Sealshot Website

Marketing and documentation site for [Sealshot](https://seal-shot.com), the
privacy-first Mac screenshot app. Built with [Astro](https://astro.build)
and [Starlight](https://starlight.astro.build); deployed on Cloudflare
Pages.

Related repos: `sealshot` (private app source) and
[`Sealshot-Release`](https://github.com/raydeng83/Sealshot-Release) (public
appcast + release assets — the download page resolves the latest DMG from
its GitHub releases at runtime).

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

## Layout

- `src/pages/` — marketing pages (landing, download, privacy, support)
- `src/content/docs/docs/` — Starlight docs served at `/docs` (the extra
  `docs/` nesting is what mounts Starlight under the path prefix)
- `docs/superpowers/` — design specs and implementation plans

## Configuration

Copy `.env.example` to `.env` and fill in (both optional — components
render fallbacks when unset):

- `PUBLIC_WEB3FORMS_KEY` — Web3Forms access key for the /support feedback
  form
- `PUBLIC_KIT_FORM_ID` — Kit (ConvertKit) form ID for the newsletter signup

Set the same variables in Cloudflare Pages → Settings → Environment
variables.

## Deploy (Cloudflare Pages)

One-time setup in the Cloudflare dashboard:

1. Workers & Pages → Create → Pages → Connect to Git → select
   `raydeng83/Sealshot-Website`.
2. Build command: `npm run build` · Build output directory: `dist`.
3. Add the environment variables above.
4. Custom domains → add `seal-shot.com` (and `www.seal-shot.com`).

After setup, every push to `main` deploys automatically.

## Releasing a new app version

1. Publish the release in Sealshot-Release as usual (the download button
   picks up the new DMG automatically).
2. Add `src/content/docs/docs/changelog/vX.Y.Z.md` here with the release
   notes. Copy the frontmatter pattern from the previous entry — it must
   include an explicit `slug: docs/changelog/vX-Y-Z` (dots become hyphens)
   and a `sidebar.order` one lower than the previous entry (v0.5.0 → `-5`)
   so versions sort newest-first.
3. Update the "latest changelog" links to the new `vX-Y-Z` slug in:
   `src/components/Footer.astro`, `src/pages/index.astro`, and
   `src/content/docs/docs/index.md`.
4. Push — Cloudflare Pages deploys `main` automatically.
