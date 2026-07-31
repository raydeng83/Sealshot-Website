# Pre-launch checklist — seal-shot.com

Everything that must work before the site goes public and the first real sale
happens. Written 2026-07-31; launch target a few weeks out.

**How to use this:** the phases are ordered by dependency, not importance.
Phase 1 has the longest lead time (DNS propagation) so it starts first;
Phase 4 is the riskiest and needs the most testing. Tick items as you go and
record the answers in the "Findings" blanks — several later steps depend on
them.

**Current state:** site deploys from `main` to Cloudflare Pages, gated by
Cloudflare Access, reachable at `sealshot-website.pages.dev`. Docs are
complete and audited against the app (release 0.7.2). Nothing can be
purchased yet — the checkout URL is still a placeholder.

---

## Phase 0 — Decisions

No dependencies; settle these first because later phases assume them.

- [x] **Newsletter provider** → **Kit** (already scaffolded in
      `NewsletterForm.astro`; posts directly to `app.kit.com`)
- [x] **Transactional provider** → **Resend** (stays; don't consolidate to
      Loops before launch)
- [x] **Human mail** → **Google Workspace user alias domain** on the existing
      `bostonidentity.com` account (free, up to 20 alias domains)
- [x] **Analytics** → **Cloudflare Web Analytics** (free, cookieless, no
      script to maintain). Enough to answer "did launch work, and where did
      traffic come from". Revisit **Plausible** ($9/mo, 30-day free trial)
      only if you later want goals/funnels — e.g. what fraction of `/buy`
      visitors reach checkout. Don't start that trial while the site is
      gated; it would only measure your testers.
      **This makes the privacy-policy edit in Phase 5 mandatory.**
- [x] **Skip** the Kit hosted landing page — launch is close enough that the
      embedded form on the site is enough.
- [ ] ~~Postal address~~ → **deferred to Phase 5**. It gates only the first
      *marketing* broadcast, not launch and not selling: CAN-SPAM's
      physical-address requirement is for commercial email, and transactional
      messages like license delivery are exempt.

---

## Phase 1 — DNS migration to Cloudflare

**Longest lead time. Start here.** Access only works for hostnames in a
Cloudflare zone, so the custom domain can't be gated until DNS moves.

### Inventory before touching anything

Current state, captured 2026-07-30:

| Record | Value |
|---|---|
| Registrar | Squarespace Domains (expires 11 Jun 2027) |
| Nameservers | `nse1–4.squarespacedns.com` |
| Apex A | Squarespace hosting (`198.185.159.144/145`, `198.49.23.144/145`) — serving a "Coming Soon" page |
| `www` | CNAME → `ext-sq.squarespace.com` |
| MX | `mxa.mailgun.org`, `mxb.mailgun.org` (priority 10) |
| SPF | `v=spf1 include:mailgun.org ~all` |
| `mail.seal-shot.com` | **no records at all** |

- [ ] **Find where Mailgun currently forwards `support@seal-shot.com`.**
      This is the single most important unknown — the MX change in Phase 3
      abandons that forwarding, and `support@` is printed on the support page.
      **Finding:** _______________________________________________
- [ ] Log into the Squarespace DNS panel and screenshot the full record list
      (external lookups can't see everything).
- [ ] Note anything else using the Squarespace site that would break.

### Migrate

- [ ] Cloudflare dashboard → **Add a site** → `seal-shot.com` → **Free** plan
- [ ] Let Cloudflare scan, then **compare its imported records against the
      table above.** Confirm specifically:
  - [ ] MX → both `mxa`/`mxb.mailgun.org`
  - [ ] TXT → the SPF record
- [ ] Add anything missing **by hand now**, while the old nameservers are
      still authoritative
- [ ] Change nameservers at Squarespace to Cloudflare's two
- [ ] Wait for the zone to show **Active** (usually under an hour)

**Verify:** `dig +short NS seal-shot.com` returns Cloudflare nameservers, and
`dig +short MX seal-shot.com` still returns the Mailgun (or new) MX.

---

## Phase 2 — Custom domain + Access

Depends on Phase 1 being Active.

- [ ] Pages project → **Custom domains** → add `seal-shot.com`
- [ ] Add `www.seal-shot.com`, plus a redirect rule (www → apex) so there's
      one canonical host
- [ ] Confirm TLS certificates issue (automatic, a few minutes)
- [ ] **This replaces the Squarespace "Coming Soon" page** — the real site
      takes over, still behind Access
- [ ] Zero Trust → **Access controls → Applications** → your app →
      **Destinations**: add `seal-shot.com` (subdomain blank) and
      `*.seal-shot.com`

**Verify — all four must return `302` to `…cloudflareaccess.com`:**

```
curl -sI https://seal-shot.com/docs/
curl -sI https://www.seal-shot.com/
curl -sI https://sealshot-website.pages.dev/docs/
curl -sI https://<some-preview-hash>.sealshot-website.pages.dev/
```

A `200` on any of them means that hostname is publicly readable.

- [ ] Confirm the Access policy allows **specific emails**, not "all
      authenticated users" — with one-time PIN as the only identity provider,
      "all authenticated users" means anyone who can receive a PIN
- [ ] Set session duration (1 week is comfortable for testers)

---

## Phase 3 — Email infrastructure

Depends on Phase 1. Independent of Phase 4, so it can run in parallel.

### Human mail — Workspace alias domain

- [ ] Admin console → **Account → Domains → Manage domains → Add a domain →
      User alias domain** → `seal-shot.com`
- [ ] Add the verification **TXT** record in Cloudflare DNS
- [ ] Change **MX** to Google (`smtp.google.com`) — **this is the destructive
      step that ends the Mailgun forwarding recorded in Phase 1**
- [ ] Update **SPF** to `v=spf1 include:_spf.google.com ~all`
- [ ] Enable **DKIM** for the alias domain and add its TXT record
- [ ] Create a free **Google Group** `support@bostonidentity.com` (alias
      domains mirror existing usernames, so this is what makes
      `support@seal-shot.com` exist)

**Verify:**
- [ ] Send from an outside address to `support@seal-shot.com` → arrives
- [ ] **Reply as** `support@seal-shot.com` from Gmail → recipient sees the
      seal-shot.com address, not your personal one
- [ ] `dig +short MX seal-shot.com` shows Google

### Transactional — Resend on `mail.seal-shot.com`

- [ ] Resend account → **Add domain** → `mail.seal-shot.com` (uses the one
      domain the free tier allows)
- [ ] Add the records Resend generates, in Cloudflare DNS:
  - [ ] TXT (SPF) on the subdomain
  - [ ] TXT (DKIM) on Resend's selector
  - [ ] MX on the subdomain (routes bounces back to Resend)
- [ ] Optionally add a DMARC TXT record on the apex
- [ ] Wait for Resend to show the domain **Verified**
- [ ] Create the API key → this becomes the `RESEND_API_KEY` secret in Phase 4

**Verify:** send a test email from the Resend dashboard as
`license@mail.seal-shot.com` to a real inbox; confirm it lands in **Inbox,
not spam**, and that headers show SPF and DKIM passing.

---

## Phase 4 — Purchase and fulfilment

**The riskiest phase.** Failures here mean a customer pays and receives
nothing. Nothing in this phase is live today — the checkout URL is a
placeholder, so there is no way to accidentally take money before it's ready.

### Known gaps to fix in code first

- [ ] **The webhook stale-timestamp gate vs Polar's retries.**
      `index.ts` rejects deliveries whose `webhook-timestamp` is more than
      **300 seconds** old (`MAX_TIMESTAMP_SKEW_SECONDS`). Polar retries up to
      **10 times with exponential backoff**, which extends well past 5
      minutes. **If Polar reuses the original timestamp on retries, every
      retry returns 400 — and Polar disables the endpoint after 10
      consecutive failures**, silently un-fulfilling all later orders.

      **Test:** point the webhook at an endpoint that always returns 500,
      trigger one order, and inspect whether retry #3 (past the 5-minute mark)
      carries a fresh timestamp.
      **Finding:** _______________________________________________

      If timestamps are reused → widen or remove the gate (idempotency
      already prevents replay harm: an order in state `sent` returns 200
      without re-emailing).

- [ ] **Decouple delivery from the webhook** (recommended regardless of the
      finding): store the license, return **200**, attempt the send in
      `ctx.waitUntil()`, and add a **Cron Trigger** Worker that retries any
      order still in state `pending`. This removes the dependency on Polar's
      retry semantics entirely.

- [ ] **Add `reply_to`.** `email.ts` sets no reply address, so replies go to
      `license@mail.seal-shot.com`, which has no inbox — they bounce. Set
      `reply_to: 'support@seal-shot.com'` (works once Phase 3 is done).

- [ ] **Add alerting.** A `pending` or `rejected` KV record is currently the
      only signal that fulfilment failed, and nothing reads KV. A cron Worker
      that emails you when an order sits `pending` past ~30 minutes closes
      this. Cloudflare's free send-to-verified-self is suited to this.

- [ ] Consider **Resend Pro ($20/mo)** for launch — removes the 100/day cap
      so a spike day can't fail sends. Mitigation, not a substitute for the
      retry work above.

### Deploy

- [ ] `wrangler kv namespace create ORDERS`, then fill in the
      `[[kv_namespaces]]` block in `wrangler.toml` (currently commented out)
- [ ] `wrangler secret put` for `SIGNING_KEY_B64`, `POLAR_WEBHOOK_SECRET`,
      `RESEND_API_KEY`
- [ ] Confirm `EMAIL_FROM` matches the verified Resend domain
- [ ] Deploy the Worker and give it a route
- [ ] **Keep the Worker route off any Access-gated hostname**, or add a
      bypass / Service Auth policy — Polar's webhooks can't answer a login
      challenge. A `workers.dev` route or a dedicated subdomain avoids this
      entirely.
- [ ] Create the Polar product and paste the **real checkout URL** into
      `src/config/promos.ts` (`BASE_CHECKOUT_URL`, and any promo entries)
- [ ] Register the webhook endpoint in Polar and store its signing secret

### Test the whole path

- [ ] **A real end-to-end purchase** (Polar test mode if available, otherwise
      a live purchase you refund): pay → webhook → license email arrives with
      the `.sealshotlicense` attachment
- [ ] **Activate that license in the app** — Settings → License → open the
      file. This is the only test that proves the signing key and file format
      are right end to end.
- [ ] **Duplicate webhook** → same license ID reused, no second email
      (idempotency)
- [ ] **Bad signature** → 401
- [ ] **Email failure** (temporarily bad API key) → order stored `pending`,
      and your retry path recovers it
- [ ] **Reply to the license email** → arrives at `support@seal-shot.com`
- [ ] Confirm Polar's own receipt email also arrives (separate from yours)

---

## Phase 5 — Marketing, forms, and disclosure

- [ ] Kit account → create a form; enable **double opt-in**
- [ ] Create one form (or tag) **per property** so subscriber source is
      recorded — you can't segment a list you can't slice
- [ ] Authenticate a **separate marketing sending domain**
      (`news.seal-shot.com`) with Kit — keeps marketing complaints away from
      the reputation of `mail.` license delivery
- [ ] Pages → **Settings → Variables and secrets**:
  - [ ] `PUBLIC_KIT_FORM_ID` — **without it the newsletter form renders
        nothing at all** (it's guarded by `formId &&`), so the site would go
        public with no signup anywhere
  - [ ] `PUBLIC_WEB3FORMS_KEY` — without it `/support` shows "the feedback
        form isn't wired up in this build"
- [ ] Redeploy, then **verify both forms render and submit while the site is
      still gated** — that's what the private preview is for
- [ ] **Do not auto-add buyers to the marketing list.** Polar collects email
      for the transaction; marketing consent is separate. Offer an explicit
      opt-in.
- [ ] Enable **Cloudflare Web Analytics** (Pages project → Analytics). No
      script tag, no cookies. Numbers are meaningless until Access is removed.

### Before the first marketing broadcast — not before launch

- [ ] **Settle the postal address.** CAN-SPAM requires a valid physical
      postal address in commercial email, and Kit won't let you send a
      broadcast without one on file. Cheapest first:
  1. **An existing business address** — if Boston Identity is a registered
     entity, its address may already serve. **Check this first; it's $0.**
  2. **USPS PO Box** — ~$25–100 per six months by size and location.
  3. **Virtual mailbox / CMRA** (Anytime Mailbox, iPostal1, PostScan) —
     ~$10–30/mo, gives a street-format address and scans mail.
  4. **Not your home address** — it becomes permanently public in every
     email, and it's an odd look for a privacy-first product.

  *Unverified:* the PO-box and CMRA allowance is long-standing FTC guidance,
  but the FTC compliance page was unreachable when this was written — worth
  confirming yourself before committing.

### Privacy policy — must land with the above, never after

`src/pages/privacy.astro` currently states *"seal-shot.com is a static site.
It uses no cookies, no trackers, and no analytics."*

- [ ] Add a **subscriber list** paragraph: provider, what's stored, how to
      unsubscribe, how to be deleted
- [ ] **Rewrite the "no analytics" sentence** — Cloudflare Web Analytics is
      going in, so describe it honestly: cookieless, aggregate, identifies
      nobody. Shipping analytics while the policy still says "no analytics"
      is the one version of this that damages credibility.
- [ ] Keep the app section unchanged — "no telemetry, no account" is still
      true and is the product's core claim

---

## Phase 6 — Site content and final checks

- [x] Changelog current through **0.7.2**; "What's new" links point at it
- [x] Docs audited against the app; `capture-live.jpg` committed
- [ ] `npm run build` clean, and no broken internal links
      (`output/`'s link checker, or re-run the script from the session)
- [ ] Walk the site on a real phone and a real Mac — landing, docs sidebar,
      `/buy`, `/download`, `/support`, `/privacy`
- [ ] **Verify the redirects** actually fire in production:

```
curl -sI https://seal-shot.com/docs/guide/getting-started/     # → /docs/quickstart/install/
curl -sI https://seal-shot.com/docs/workflows/bug-reports/     # → /docs/workflows/explain/
curl -sI https://seal-shot.com/docs/workflows/remember/        # → /docs/workflows/
```

- [ ] Check the 404 page renders sensibly
- [ ] Confirm `/download/` resolves the current DMG from the Sealshot-Release
      repo
- [ ] Consider compressing `capture-area.png` (9.8 MB) and
      `capture-window.png` (8.4 MB) — biggest page-weight items on the site
- [ ] Update the consolidated PDF (`output/README.md` has the steps) if you
      want the launch edition to match the shipped docs

---

## Phase 7 — Go public

- [ ] Final pass: every Phase 4 test green
- [ ] Delete (or empty) the Access application(s) — **the site itself never
      redeploys for this**, it's a config deletion
- [ ] Verify: `curl -sI https://seal-shot.com/` returns **200**, not a 302
- [ ] Confirm `sitemap-index.xml` and `robots.txt` are reachable now that
      crawlers can see the site
- [ ] Make a real purchase from a clean machine as a final smoke test
- [ ] Announce — and only now does the newsletter list matter

---

## Ordering summary

```
Phase 1 (DNS)  ──► Phase 2 (domain + Access)
               └─► Phase 3 (Workspace alias, Resend)  ──► Phase 4 (purchase path)
Phase 5 (marketing + privacy policy)   — parallel, needs Phase 1 for news. subdomain
Phase 6 (content checks)               — parallel, no dependencies
                                        └─► Phase 7 (go public)
```

Start Phase 1 today; it's the only one with a clock you can't compress.
Phase 4 needs the most calendar time for testing, not setup.
