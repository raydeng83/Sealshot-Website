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

## Analytics and the weekly report

Two numbers, one email, no visitor identifiers anywhere.

- **Traffic** — Cloudflare Web Analytics. There is no code for this in the
  repo: Pages → the project → **Metrics → Web Analytics → Enable** injects the
  beacon on the *next* deployment.
- **Download clicks** — `workers/site-analytics`. The two download buttons
  carry `data-track-download`, and `src/components/TrackDownload.astro`
  `sendBeacon`s one event per click. The click is never delayed and no href
  changes.
- **Weekly report** — the same Worker, Monday 13:00 UTC, emailed through Resend
  to the addresses in `REPORT_TO`.

**Cron Triggers are UTC-only** — Cloudflare has no timezone setting — so
`0 13 * * 1` is 9am Boston under EDT and 8am under EST, and that hour drifts
with daylight saving. Reporting days are UTC days, matching the order records
in `workers/license-fulfillment`.

The report says **Visits**, never "Visitors": Cloudflare Web Analytics is
cookieless and stores no visitor identifier, so it has no unique-visitor metric
to report.

### One-time setup

1. Pages → **Metrics → Web Analytics → Enable**, then redeploy.
2. From the Web Analytics dashboard, copy the **site tag** into
   `CF_RUM_SITE_TAG` in `workers/site-analytics/wrangler.toml`, and your
   Account ID into `CF_ACCOUNT_ID`. The site tag is **not** the token in the
   beacon's `data-cf-beacon` attribute — Cloudflare issues two different 32-hex
   values per property, and the beacon carries the *token*. Using the token
   here returns an empty result rather than an error, so the report would show
   zeroes that look like a quiet week.
3. Create an API token with **Account → Account Analytics → Read**. One token
   serves both the GraphQL traffic query and the Analytics Engine SQL API.
4. **Turn on Analytics Engine**: dashboard → **Storage & Databases → Analytics
   Engine → Enable**. Dismiss the "Create Dataset" dialog it opens — the
   dataset is created automatically on the first write.

   This step is missing from Cloudflare's own "Get started with Workers
   Analytics Engine" page, and skipping it is invisible until you query. Writes
   through the binding succeed, the SQL API answers `403` with a plain-text
   `Authorization error` and no error code, and a correctly scoped token looks
   like the culprit — it is not. Verified against this account on 2026-09-08:
   the same token returned live data from the GraphQL API and `403` from the
   SQL API in the same minute. Deploying a Worker with an Analytics Engine
   binding can also fail with `403 [10089] "You need to enable Analytics
   Engine"` for the same reason. It is an account-level opt-in, free, and
   unrelated to the Workers plan.

```bash
cd workers/site-analytics
npm install
npx wrangler secret put CF_API_TOKEN
npx wrangler secret put RESEND_API_KEY   # same value as license-fulfillment
npx wrangler deploy                      # keep it on the workers.dev route
```

`ANALYTICS_WORKER_ORIGIN` in `src/config/worker.ts` must match the deployed
Worker name. A mismatch fails silently — `sendBeacon` ignores the response, so
clicks are simply never counted.

### Testing without waiting for Monday

```bash
cd workers/site-analytics
npm test                                 # pure units: windows, report, endpoint
echo 'DRY_RUN=1' > .dev.vars             # compose and log the report, do not send
npx wrangler dev --test-scheduled
curl 'http://localhost:8787/__scheduled?cron=0+13+*+*+1'
```

`DRY_RUN` runs the real queries against the real APIs and prints the finished
email instead of sending it.

### Turning it off

- **The report only** — delete `[triggers]` from `wrangler.toml` and redeploy;
  clicks keep being counted.
- **Click counting** — remove the two `data-track-download` attributes.
- **Traffic** — untick Pages → Metrics → Web Analytics.
- **All of it** — `npx wrangler delete site-analytics`, revert the site files.

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
