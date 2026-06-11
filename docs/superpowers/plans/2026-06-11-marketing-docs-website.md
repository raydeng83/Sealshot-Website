# Sealshot Marketing & Documentation Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static marketing + documentation site for Sealshot at seal-shot.com, per the approved spec at `docs/superpowers/specs/2026-06-11-marketing-docs-website-design.md`.

**Architecture:** A single Astro project. Custom Astro pages handle marketing (landing, download, privacy, support); the Starlight integration serves docs at `/docs` from Markdown in `src/content/docs/docs/` (the extra `docs/` nesting is what mounts Starlight under the `/docs` path prefix instead of the site root). Purely static output deployed to Cloudflare Pages.

**Tech Stack:** Astro 5, @astrojs/starlight, Cloudflare Pages, Web3Forms (feedback form endpoint), Kit/ConvertKit (newsletter form endpoint). Node v22 + npm available locally.

**Testing approach:** This is a static content site with no application logic, so there is no unit-test framework. Each task's verification is: `npm run build` succeeds (Astro validates content collections, sidebar slugs, and asset references at build time) plus `grep` checks against `dist/` output. Run all commands from the repo root `/Users/ledeng/projects/Sealshot-Website`.

**External accounts (user-supplied, not blocking):** The feedback form needs a Web3Forms access key and the newsletter needs a Kit form ID. Both are injected via `PUBLIC_*` env vars; every component renders a graceful fallback when unset, so all tasks build and ship without them. The user creates the accounts and sets the vars later (locally in `.env`, and in Cloudflare Pages settings).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/content.config.ts`
- Create: `src/content/docs/docs/index.md`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "sealshot-website",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.36.0",
    "astro": "^5.0.0",
    "sharp": "^0.34.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.env
.DS_Store
```

- [ ] **Step 3: Create `.env.example`**

```
# Web3Forms access key for the /support feedback form (https://web3forms.com)
PUBLIC_WEB3FORMS_KEY=

# Kit (ConvertKit) form ID for the newsletter signup (https://kit.com)
# The numeric ID from the form's embed code: app.kit.com/forms/<ID>/subscriptions
PUBLIC_KIT_FORM_ID=
```

- [ ] **Step 4: Create `astro.config.mjs`**

Sidebar entries reference docs pages created in Task 8; Starlight only validates `slug:` sidebar links against existing pages at build time, so the sidebar config is added in Task 8, not here. Logo config is added in Task 2 once the icon asset exists.

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://seal-shot.com',
  integrations: [
    starlight({
      title: 'Sealshot Docs',
    }),
  ],
});
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 6: Create `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

- [ ] **Step 7: Create `src/content/docs/docs/index.md`** (minimal docs landing so the collection is non-empty; expanded in Task 8)

```md
---
title: Sealshot Documentation
description: User guide, FAQ, and changelog for Sealshot.
---

Welcome to the Sealshot documentation.
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: completes without errors; `package-lock.json` and `node_modules/` appear.

- [ ] **Step 9: Verify the build**

Run: `npm run build`
Expected: exits 0, ends with a "Complete!" line, and `dist/docs/index.html` exists.

Run: `grep -c "Sealshot Documentation" dist/docs/index.html`
Expected: `1` or more.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example astro.config.mjs tsconfig.json src/
git commit -m "feat: scaffold Astro + Starlight project"
```

---

### Task 2: Brand assets

**Files:**
- Create: `src/assets/icon.png` (copied from the sealshot dev repo)
- Create: `public/favicon.png`
- Create: `public/og-image.png`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Copy icons from the dev repo**

```bash
mkdir -p src/assets
cp /Users/ledeng/projects/sealshot/app/Resources/Assets.xcassets/AppIcon.appiconset/icon_256.png src/assets/icon.png
cp /Users/ledeng/projects/sealshot/app/Resources/Assets.xcassets/AppIcon.appiconset/icon_64.png public/favicon.png
cp /Users/ledeng/projects/sealshot/app/Resources/Assets.xcassets/AppIcon.appiconset/icon_1024.png public/og-image.png
```

- [ ] **Step 2: Point Starlight at the logo and favicon** — in `astro.config.mjs`, replace the `starlight({ ... })` block:

```js
    starlight({
      title: 'Sealshot Docs',
      logo: { src: './src/assets/icon.png', alt: 'Sealshot' },
      favicon: '/favicon.png',
    }),
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exits 0; `ls dist/favicon.png dist/og-image.png` shows both files.

- [ ] **Step 4: Commit**

```bash
git add src/assets public astro.config.mjs
git commit -m "feat: add brand assets and wire Starlight logo/favicon"
```

---

### Task 3: Design tokens and shared marketing components

**Files:**
- Create: `src/styles/global.css`
- Create: `src/components/Header.astro`
- Create: `src/components/NewsletterForm.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/SiteLayout.astro`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
:root {
  --ink-950: #070d18;
  --ink-900: #0b1220;
  --ink-800: #121c30;
  --ink-700: #1c2a45;
  --teal-400: #2dd4bf;
  --teal-300: #5eead4;
  --text-100: #eef2f8;
  --text-300: #b8c2d4;
  --text-500: #7e8aa0;
  --radius: 12px;
  --max-width: 72rem;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--ink-900);
  color: var(--text-100);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.6;
}

a {
  color: var(--teal-300);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

h1, h2, h3 {
  line-height: 1.2;
  margin: 0 0 0.5em;
}

.wrap {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1.5rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Buttons */
.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 600;
  background: var(--teal-400);
  color: var(--ink-950);
}

.button:hover {
  background: var(--teal-300);
  text-decoration: none;
}

.button.secondary {
  background: var(--ink-700);
  color: var(--text-100);
}

/* Header */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1rem 1.5rem;
}

.site-header .brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-100);
}

.site-header nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.site-header nav a {
  color: var(--text-300);
}

.site-header nav a.cta {
  color: var(--ink-950);
  background: var(--teal-400);
  padding: 0.45rem 1rem;
  border-radius: var(--radius);
}

.site-header nav a.cta:hover {
  background: var(--teal-300);
  text-decoration: none;
}

/* Sections */
.section {
  padding: 4rem 0;
}

.section.alt {
  background: var(--ink-950);
}

.section h2 {
  font-size: 2rem;
}

.kicker {
  color: var(--teal-400);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
}

/* Hero */
.hero {
  text-align: center;
  padding: 5rem 0 3rem;
}

.hero h1 {
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  max-width: 46rem;
  margin: 0 auto 0.5em;
}

.hero .sub {
  color: var(--text-300);
  font-size: 1.25rem;
  max-width: 38rem;
  margin: 0 auto 2rem;
}

.hero .actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.screenshot-placeholder {
  margin: 3rem auto 0;
  max-width: 56rem;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius);
  border: 1px solid var(--ink-700);
  background: linear-gradient(135deg, var(--ink-800), var(--ink-700));
  display: grid;
  place-items: center;
  color: var(--text-500);
}

/* Feature grid */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.feature {
  background: var(--ink-800);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.feature h3 {
  font-size: 1.1rem;
}

.feature p {
  color: var(--text-300);
  margin: 0;
}

/* Forms */
.form-card {
  background: var(--ink-800);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius);
  padding: 2rem;
  max-width: 36rem;
}

.form-card label {
  display: block;
  font-weight: 600;
  margin: 1rem 0 0.3rem;
}

.form-card input,
.form-card select,
.form-card textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--ink-700);
  background: var(--ink-900);
  color: var(--text-100);
  font: inherit;
}

.form-card button {
  margin-top: 1.5rem;
}

.notice {
  background: var(--ink-700);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}

.newsletter {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.newsletter input {
  flex: 1;
  min-width: 14rem;
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius);
  border: 1px solid var(--ink-700);
  background: var(--ink-900);
  color: var(--text-100);
  font: inherit;
}

.newsletter button {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius);
  border: none;
  background: var(--teal-400);
  color: var(--ink-950);
  font-weight: 600;
  cursor: pointer;
}

.newsletter button:hover {
  background: var(--teal-300);
}

.fine-print {
  color: var(--text-500);
  font-size: 0.85rem;
}

/* Footer */
.site-footer {
  background: var(--ink-950);
  border-top: 1px solid var(--ink-700);
  padding: 3rem 0 2rem;
  margin-top: 4rem;
}

.site-footer .cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 2rem;
}

.site-footer h3 {
  font-size: 0.95rem;
  color: var(--text-300);
}

.site-footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-footer li {
  margin: 0.4rem 0;
}

.site-footer .legal {
  margin-top: 2.5rem;
  color: var(--text-500);
  font-size: 0.85rem;
}

/* Prose pages (privacy) */
.prose {
  max-width: 44rem;
}

.prose h2 {
  font-size: 1.4rem;
  margin-top: 2rem;
}

.prose p, .prose li {
  color: var(--text-300);
}
```

- [ ] **Step 2: Create `src/components/Header.astro`**

```astro
---
import { Image } from 'astro:assets';
import icon from '../assets/icon.png';
---

<header class="site-header">
  <a class="brand" href="/">
    <Image src={icon} alt="" width={32} height={32} />
    <span>Sealshot</span>
  </a>
  <nav>
    <a href="/#features">Features</a>
    <a href="/docs/">Docs</a>
    <a href="/support/">Support</a>
    <a class="cta" href="/download/">Download</a>
  </nav>
</header>
```

- [ ] **Step 3: Create `src/components/NewsletterForm.astro`**

When `PUBLIC_KIT_FORM_ID` is unset the component renders nothing (the surrounding copy still invites users to check the changelog), so the site builds and ships before the Kit account exists.

```astro
---
const formId = import.meta.env.PUBLIC_KIT_FORM_ID;
---

{
  formId && (
    <form
      class="newsletter"
      action={`https://app.kit.com/forms/${formId}/subscriptions`}
      method="post"
    >
      <label class="visually-hidden" for="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email_address"
        placeholder="you@example.com"
        required
      />
      <button type="submit">Get updates</button>
    </form>
  )
}
{
  formId && (
    <p class="fine-print">
      Product updates only. Double opt-in, unsubscribe anytime, never shared.
    </p>
  )
}
```

- [ ] **Step 4: Create `src/components/Footer.astro`**

```astro
---
import NewsletterForm from './NewsletterForm.astro';
---

<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>
        <h3>Product</h3>
        <ul>
          <li><a href="/#features">Features</a></li>
          <li><a href="/download/">Download</a></li>
          <li><a href="/docs/changelog/v0-4-0/">Changelog</a></li>
        </ul>
      </div>
      <div>
        <h3>Resources</h3>
        <ul>
          <li><a href="/docs/">Documentation</a></li>
          <li><a href="/docs/faq/">FAQ</a></li>
          <li><a href="/support/">Support &amp; feedback</a></li>
          <li><a href="/privacy/">Privacy</a></li>
        </ul>
      </div>
      <div>
        <h3>Stay in the loop</h3>
        <p class="fine-print">New features, releases, and tips.</p>
        <NewsletterForm />
      </div>
    </div>
    <p class="legal">
      Sealshot — privacy-first screenshots for macOS 14+. No account, no
      telemetry, no cloud.
    </p>
  </div>
</footer>
```

(Note: the changelog footer link uses Starlight's slugified path `/docs/changelog/v0-4-0/` — dots become hyphens. Task 8 creates that page; the link 404s only until Task 8 lands, and the Task 8 verification covers it.)

- [ ] **Step 5: Create `src/layouts/SiteLayout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/favicon.png" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL('/og-image.png', Astro.site)} />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Verify the build**

The layout isn't used by a page yet, so this just confirms nothing is syntactically broken.

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/styles src/components src/layouts
git commit -m "feat: add design tokens, shared layout, header/footer, newsletter form"
```

---

### Task 4: Landing page

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create `src/pages/index.astro`**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
import NewsletterForm from '../components/NewsletterForm.astro';

const features = [
  {
    title: 'Capture anything',
    body: 'Area, window, fullscreen, delayed, freeze-frame element selection across displays, and scrolling capture with automatic stitching.',
  },
  {
    title: 'Annotate non-destructively',
    body: 'Shapes, arrows, freehand pen, text, numbered badges — original pixels stay untouched, and undo history survives relaunch.',
  },
  {
    title: 'Redact with confidence',
    body: 'Pixelate, mosaic, gaussian, or solid-fill regions to keep keys, tokens, and faces out of what you share.',
  },
  {
    title: 'Search everything',
    body: 'On-device OCR powers Live Text selection and full-text search across your entire screenshot library.',
  },
  {
    title: 'Smart metadata',
    body: 'Titles, tags, and categories generated automatically from capture context and OCR — entirely on device.',
  },
  {
    title: 'The .seal format',
    body: 'Original pixels plus annotations in one package. Re-edit anytime; export flat PNG when you need it.',
  },
];
---

<SiteLayout
  title="Sealshot — privacy-first screenshots for Mac"
  description="Capture, annotate, and redact screenshots with everything processed on device. No account, no telemetry, no cloud."
>
  <section class="hero wrap">
    <p class="kicker">For macOS 14+</p>
    <h1>Screenshots that keep your secrets</h1>
    <p class="sub">
      Capture, annotate, and redact — all processed on your Mac. No account.
      No telemetry. No cloud.
    </p>
    <div class="actions">
      <a class="button" href="/download/">Download for Mac</a>
      <a class="button secondary" href="/docs/">Read the docs</a>
    </div>
    <div class="screenshot-placeholder">App screenshot coming soon</div>
  </section>

  <section class="section" id="features">
    <div class="wrap">
      <p class="kicker">Features</p>
      <h2>Everything a screenshot tool should do</h2>
      <div class="features">
        {
          features.map((f) => (
            <div class="feature">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))
        }
      </div>
    </div>
  </section>

  <section class="section alt">
    <div class="wrap">
      <p class="kicker">Privacy</p>
      <h2>Your screen is your business</h2>
      <p class="sub" style="margin: 0; max-width: 44rem;">
        Screenshots routinely contain credentials, customer data, and private
        conversations. Sealshot processes everything — OCR, metadata, search —
        on your Mac. Nothing is uploaded, no account is required, and no
        telemetry is collected.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <p class="kicker">Stay in the loop</p>
      <h2>Get Sealshot updates</h2>
      <p class="sub" style="margin: 0 0 1.5rem; max-width: 44rem;">
        New features, releases, and tips — or watch the
        <a href="/docs/changelog/v0-4-0/">changelog</a>.
      </p>
      <NewsletterForm />
    </div>
  </section>
</SiteLayout>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c "Screenshots that keep your secrets" dist/index.html && grep -c "scrolling capture" dist/index.html`
Expected: `1` (or more) for each grep.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add marketing landing page"
```

---

### Task 5: Download page

**Files:**
- Create: `src/pages/download.astro`

- [ ] **Step 1: Create `src/pages/download.astro`**

Release assets in Sealshot-Release are version-named (`Sealshot-0.4.0.dmg`), so the page resolves the current DMG client-side from the GitHub releases API. The default `href` is the releases page, which works as the no-JS fallback. `is:inline` keeps the script out of Astro's TypeScript bundling pipeline.

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
---

<SiteLayout
  title="Download Sealshot for Mac"
  description="Get the latest Sealshot release for macOS 14+. Universal binary for Apple Silicon and Intel."
>
  <section class="hero wrap">
    <p class="kicker">Download</p>
    <h1>Get Sealshot for Mac</h1>
    <p class="sub">
      Signed, notarized, and updated automatically. Universal binary for Apple
      Silicon and Intel, macOS 14 or later.
    </p>
    <div class="actions">
      <a
        class="button"
        id="dmg-link"
        href="https://github.com/raydeng83/Sealshot-Release/releases/latest"
      >
        Download for Mac
      </a>
    </div>
    <p class="fine-print" id="dmg-meta">Direct download (.dmg)</p>
    <p class="fine-print">
      Coming soon to the Mac App Store. Direct builds update themselves via
      Sparkle. All releases are published on
      <a href="https://github.com/raydeng83/Sealshot-Release/releases"
        >GitHub</a
      >.
    </p>
  </section>
</SiteLayout>

<script is:inline>
  fetch(
    'https://api.github.com/repos/raydeng83/Sealshot-Release/releases/latest'
  )
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject(new Error('http ' + r.status));
    })
    .then(function (release) {
      var dmg = (release.assets || []).find(function (a) {
        return a.name.endsWith('.dmg');
      });
      if (!dmg) return;
      document.getElementById('dmg-link').href = dmg.browser_download_url;
      document.getElementById('dmg-meta').textContent =
        'Direct download (.dmg) · ' + release.tag_name;
    })
    .catch(function () {
      /* fallback href already points at the releases page */
    });
</script>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c "releases/latest" dist/download/index.html && grep -c "api.github.com" dist/download/index.html`
Expected: `1` (or more) for each grep.

- [ ] **Step 3: Commit**

```bash
git add src/pages/download.astro
git commit -m "feat: add download page resolving latest DMG from GitHub"
```

---

### Task 6: Privacy page

**Files:**
- Create: `src/pages/privacy.astro`

- [ ] **Step 1: Create `src/pages/privacy.astro`**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
---

<SiteLayout
  title="Privacy — Sealshot"
  description="What Sealshot and seal-shot.com do (and don't do) with your data."
>
  <section class="section wrap prose">
    <p class="kicker">Privacy policy</p>
    <h1>Privacy</h1>
    <p>Effective June 11, 2026.</p>

    <h2>The app</h2>
    <p>
      Sealshot processes everything on your Mac. Screenshots, OCR text,
      annotations, generated metadata, and search indexes never leave your
      device. The app requires no account, collects no telemetry or analytics,
      and makes no network requests with your content.
    </p>
    <p>
      The only network activity in the Direct build is the Sparkle update
      check, which fetches a public version feed and downloads updates. It
      sends no personal data. Mac App Store builds update through the App
      Store.
    </p>

    <h2>This website</h2>
    <p>
      seal-shot.com is a static site. It uses no cookies, no trackers, and no
      analytics.
    </p>

    <h2>Feedback form</h2>
    <p>
      If you send feedback through the <a href="/support/">support form</a>,
      your message (and email address, if you choose to include one) is
      delivered to us via Web3Forms, a form-relay service, and arrives in our
      inbox. We use it only to respond to you and improve Sealshot. It is
      never sold or shared.
    </p>

    <h2>Newsletter</h2>
    <p>
      If you sign up for updates, your email address is stored with Kit, our
      email service, and used only to send Sealshot product updates. Signup is
      double opt-in, every email includes an unsubscribe link, and your
      address is never sold or shared.
    </p>

    <h2>Questions</h2>
    <p>
      Anything unclear? <a href="/support/">Ask us</a> — privacy questions are
      always welcome.
    </p>
  </section>
</SiteLayout>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c "no telemetry" dist/privacy/index.html`
Expected: `1` or more.

- [ ] **Step 3: Commit**

```bash
git add src/pages/privacy.astro
git commit -m "feat: add privacy policy page"
```

---

### Task 7: Support page with feedback form

**Files:**
- Create: `src/pages/support.astro`

- [ ] **Step 1: Create `src/pages/support.astro`**

The form posts directly to Web3Forms (plain HTML POST, no JS required). A hidden `redirect` field returns the user to `/support/?sent=1`, and a tiny inline script shows a success banner for that query param. The hidden `botcheck` checkbox is Web3Forms' honeypot. When `PUBLIC_WEB3FORMS_KEY` is unset, the page shows an email-us fallback instead of a broken form.

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';

const accessKey = import.meta.env.PUBLIC_WEB3FORMS_KEY;
---

<SiteLayout
  title="Support & feedback — Sealshot"
  description="Report a bug, request a feature, or send us feedback about Sealshot."
>
  <section class="section wrap">
    <p class="kicker">Support</p>
    <h1>Feedback &amp; support</h1>
    <p class="sub" style="max-width: 44rem;">
      Found a bug? Missing a feature? Check the <a href="/docs/faq/">FAQ</a>
      first — and if that doesn't cover it, tell us below.
    </p>

    <div id="sent-notice" class="notice" hidden>
      Thanks — your feedback is on its way. We read everything.
    </div>

    {
      accessKey ? (
        <form
          class="form-card"
          action="https://api.web3forms.com/submit"
          method="post"
        >
          <input type="hidden" name="access_key" value={accessKey} />
          <input
            type="hidden"
            name="redirect"
            value="https://seal-shot.com/support/?sent=1"
          />
          <input
            type="checkbox"
            name="botcheck"
            class="visually-hidden"
            tabindex="-1"
            autocomplete="off"
          />

          <label for="fb-name">Name (optional)</label>
          <input id="fb-name" type="text" name="name" />

          <label for="fb-email">Email (optional — only if you want a reply)</label>
          <input id="fb-email" type="email" name="email" />

          <label for="fb-type">Type</label>
          <select id="fb-type" name="type">
            <option>Bug report</option>
            <option>Feature request</option>
            <option>General feedback</option>
          </select>

          <label for="fb-message">Message</label>
          <textarea id="fb-message" name="message" rows="6" required />

          <button class="button" type="submit">
            Send feedback
          </button>
          <p class="fine-print">
            Delivered to our inbox via Web3Forms. Used only to respond to you —
            see our <a href="/privacy/">privacy policy</a>.
          </p>
        </form>
      ) : (
        <p>
          The feedback form isn't wired up in this build — email us instead at
          <a href="mailto:support@seal-shot.com">support@seal-shot.com</a>.
        </p>
      )
    }
  </section>
</SiteLayout>

<script is:inline>
  if (new URLSearchParams(location.search).get('sent') === '1') {
    document.getElementById('sent-notice').hidden = false;
  }
</script>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c "support@seal-shot.com\|web3forms.com" dist/support/index.html`
Expected: `1` or more (which branch renders depends on whether `PUBLIC_WEB3FORMS_KEY` is set locally).

- [ ] **Step 3: Commit**

```bash
git add src/pages/support.astro
git commit -m "feat: add support page with Web3Forms feedback form"
```

---

### Task 8: Documentation content and Starlight theme

**Files:**
- Create: `src/styles/starlight.css`
- Modify: `astro.config.mjs`
- Modify: `src/content/docs/docs/index.md`
- Create: `src/content/docs/docs/guide/getting-started.md`
- Create: `src/content/docs/docs/guide/capture.md`
- Create: `src/content/docs/docs/guide/editor.md`
- Create: `src/content/docs/docs/guide/library.md`
- Create: `src/content/docs/docs/guide/seal-format.md`
- Create: `src/content/docs/docs/faq.md`
- Create: `src/content/docs/docs/changelog/v0.4.0.md`

- [ ] **Step 1: Create `src/styles/starlight.css`** (match docs accent to the marketing brand)

```css
:root {
  --sl-color-accent-low: #0c3d38;
  --sl-color-accent: #14b8a6;
  --sl-color-accent-high: #99f0e3;
}

:root[data-theme='light'] {
  --sl-color-accent-low: #c9f6ef;
  --sl-color-accent: #0d9488;
  --sl-color-accent-high: #0c3d38;
}
```

- [ ] **Step 2: Update `astro.config.mjs`** — replace the `starlight({ ... })` block with the full docs config:

```js
    starlight({
      title: 'Sealshot Docs',
      logo: { src: './src/assets/icon.png', alt: 'Sealshot' },
      favicon: '/favicon.png',
      customCss: ['./src/styles/starlight.css'],
      sidebar: [
        {
          label: 'Guide',
          items: [
            { slug: 'docs/guide/getting-started' },
            { slug: 'docs/guide/capture' },
            { slug: 'docs/guide/editor' },
            { slug: 'docs/guide/library' },
            { slug: 'docs/guide/seal-format' },
          ],
        },
        { label: 'FAQ', slug: 'docs/faq' },
        {
          label: 'Changelog',
          autogenerate: { directory: 'docs/changelog' },
        },
        { label: 'Support & feedback', link: '/support/' },
        { label: 'seal-shot.com', link: '/' },
      ],
    }),
```

- [ ] **Step 3: Replace `src/content/docs/docs/index.md`**

```md
---
title: Sealshot Documentation
description: User guide, FAQ, and changelog for Sealshot — the privacy-first Mac screenshot app.
---

Sealshot is a privacy-first screenshot app for macOS 14+. Everything —
capture, OCR, metadata, search — is processed on your Mac. No account, no
telemetry, no cloud.

- **New here?** Start with [Getting started](/docs/guide/getting-started/).
- **Stuck?** Check the [FAQ](/docs/faq/) or [send us feedback](/support/).
- **What's new?** See the [changelog](/docs/changelog/v0-4-0/).
```

- [ ] **Step 4: Create `src/content/docs/docs/guide/getting-started.md`**

```md
---
title: Getting started
description: Install Sealshot and take your first capture.
---

## Requirements

Sealshot runs on macOS 14 (Sonoma) or later, on both Apple Silicon and Intel
Macs.

## Install

1. [Download the latest .dmg](/download/) from seal-shot.com.
2. Open the .dmg and drag **Sealshot** into your Applications folder.
3. Launch Sealshot. macOS will ask for **Screen Recording** permission the
   first time you capture — Sealshot needs it to see the screen, and the
   pixels never leave your Mac.

Direct downloads are signed and notarized, and update themselves
automatically via Sparkle.

## Your first capture

With Sealshot running, start an area capture and drag across the region you
want. Adjust the selection with the handles, confirm, and the capture opens
in the editor — ready to annotate, redact, or export.

From there, explore:

- [Capture modes](/docs/guide/capture/) — windows, fullscreen, delayed,
  scrolling, and more.
- [The editor](/docs/guide/editor/) — annotations, blur and redaction, OCR.
- [Your library](/docs/guide/library/) — organizing and searching captures.
```

- [ ] **Step 5: Create `src/content/docs/docs/guide/capture.md`**

```md
---
title: Capture modes
description: Area, window, fullscreen, delayed, element, and scrolling capture.
---

Sealshot offers six ways to capture your screen.

## Area

Select a region by dragging, or click once to set a corner, move, and click
again. Either way, you get adjustable handles to fine-tune the selection
before confirming.

## Window

Capture a single window with smart boundary detection — Sealshot snaps to
the window's true edges.

## Fullscreen

Capture an entire display in one shot.

## Delayed

Need to capture a menu or a hover state? Start a delayed capture and an
on-screen countdown gives you time to set the stage.

## Element selection

Freeze-frame element selection pauses the screen and lets you pick
individual UI elements — across all of your displays.

## Scrolling capture

Capture content taller than the screen — long pages, chat threads,
documents. Sealshot scrolls and stitches the result into a single seamless
image automatically.
```

- [ ] **Step 6: Create `src/content/docs/docs/guide/editor.md`**

```md
---
title: The editor
description: Annotations, blur and redaction, OCR text selection, and image enhancement.
---

Every capture opens in Sealshot's non-destructive editor: your original
pixels are always preserved, and every annotation can be moved or removed
later.

## Annotations

Add shapes, arrows, lines, freehand pen strokes, text, and numbered badges.
Annotations live on their own layer above the image.

## Blur and redaction

Hide sensitive content with four region styles: **pixelate**, **mosaic**,
**gaussian blur**, or **solid fill**. Use solid fill when the content
underneath must be unrecoverable.

Automatic flagging of API keys, PII, and faces (Smart Redaction) is on the
roadmap — today, redaction is manual via the blur tool.

## OCR Live Text

Select and copy text straight out of your screenshots. OCR runs entirely on
your Mac.

## Focus crop and enhancement

Crop to what matters and apply image enhancement to make captures clearer.

## Undo that survives relaunch

The editor's undo history is persistent — quit and relaunch, and you can
still step backwards through your edits.
```

- [ ] **Step 7: Create `src/content/docs/docs/guide/library.md`**

```md
---
title: Library & search
description: Organizing captures with automatic metadata and OCR full-text search.
---

## Recent captures

A recent-captures strip keeps your latest screenshots one click away.

## Automatic metadata

Sealshot generates titles, tags, and categories for every capture from its
context and OCR text — entirely on device. No naming screenshots by hand.

## Full-text search

Because every capture is OCR'd locally, the library's search looks *inside*
your screenshots. Search for an error message, a name, or a code fragment
and find the capture that contains it.
```

- [ ] **Step 8: Create `src/content/docs/docs/guide/seal-format.md`**

```md
---
title: The .seal format
description: What .seal files are and how to export to PNG and other formats.
---

Sealshot saves captures as `.seal` packages: the original, untouched pixels
plus your annotations, stored together in one file.

## Why a custom format?

Flat image files bake annotations into the pixels — once you export, an
arrow can never be moved and a blur can never be adjusted. A `.seal` file
keeps everything editable: reopen it next month and rearrange, restyle, or
remove any annotation.

## Exporting

When you need a regular image, export to flat PNG (or other standard
formats) from the editor. The `.seal` original stays intact, so you can
always re-export differently later.
```

- [ ] **Step 9: Create `src/content/docs/docs/faq.md`**

```md
---
title: FAQ
description: Frequently asked questions about Sealshot.
---

## Does Sealshot send my screenshots anywhere?

No. Capture, OCR, metadata generation, and search all run on your Mac.
Nothing is uploaded, there is no account, and there is no telemetry. See the
[privacy policy](/privacy/) for the full picture.

## What does Sealshot run on?

macOS 14 (Sonoma) or later, as a universal binary for Apple Silicon and
Intel.

## How do I update Sealshot?

Direct downloads update themselves via Sparkle — you'll be offered new
versions automatically. Every release is also published on
[GitHub](https://github.com/raydeng83/Sealshot-Release/releases).

## Why does Sealshot need Screen Recording permission?

macOS requires it for any app that captures the screen. Sealshot uses it
only when you take a capture, and the pixels never leave your device.

## What is a .seal file?

Sealshot's native format: your original pixels plus annotations in one
editable package. See [The .seal format](/docs/guide/seal-format/).

## Can Sealshot automatically detect API keys and faces?

Not yet — Smart Redaction (automatic flagging of API keys, PII, and faces)
is the headline roadmap feature. Today you redact manually with the
[blur tools](/docs/guide/editor/#blur-and-redaction).

## I found a bug / I want a feature

We want to hear it — use the [feedback form](/support/).
```

- [ ] **Step 10: Create `src/content/docs/docs/changelog/v0.4.0.md`**

```md
---
title: Sealshot 0.4.0
description: Release notes for Sealshot 0.4.0.
---

**Released June 11, 2026** ·
[Download](https://github.com/raydeng83/Sealshot-Release/releases/tag/v0.4.0)

Sealshot 0.4.0 is the latest direct-download release — signed, notarized,
and delivered automatically to existing installs via Sparkle.

Sealshot at this release:

- **Capture** — area, window, fullscreen, delayed, freeze-frame element
  selection, and scrolling capture with automatic stitching.
- **Editor** — non-destructive annotations, four blur/redaction styles, OCR
  Live Text, focus crop, image enhancement, persistent undo history.
- **Library** — on-device automatic titles/tags/categories and OCR
  full-text search.
- **Format** — `.seal` packages with PNG export.
```

- [ ] **Step 11: Verify the build**

Run: `npm run build`
Expected: exits 0 with no sidebar/slug warnings.

Run: `ls dist/docs/guide/capture/index.html dist/docs/faq/index.html dist/docs/changelog/v0-4-0/index.html`
Expected: all three files exist (note the slugified `v0-4-0` path).

Run: `grep -c "Smart Redaction" dist/docs/faq/index.html`
Expected: `1` or more.

- [ ] **Step 12: Commit**

```bash
git add astro.config.mjs src/styles/starlight.css src/content/docs
git commit -m "feat: add user guide, FAQ, and changelog docs with branded theme"
```

---

### Task 9: README and Cloudflare Pages deployment

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````md
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
   notes and push.
````

- [ ] **Step 2: Final full verification**

Run: `npm run build`
Expected: exits 0.

Run: `ls dist/index.html dist/download/index.html dist/privacy/index.html dist/support/index.html dist/docs/index.html`
Expected: all five files exist.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: add README with development and deployment instructions"
git push -u origin main
```

- [ ] **Step 4: Hand off the manual steps to the user**

Tell the user the remaining steps that require their accounts (these cannot be automated):

1. Connect the repo in the Cloudflare Pages dashboard (steps in README) and
   add the seal-shot.com custom domain.
2. Create a Web3Forms access key (free, takes an email address) and set
   `PUBLIC_WEB3FORMS_KEY` in Cloudflare Pages env vars.
3. Create a Kit account + form and set `PUBLIC_KIT_FORM_ID` likewise.
4. Replace the landing-page screenshot placeholder with a real app
   screenshot when ready.
