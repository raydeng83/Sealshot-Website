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

Original state, captured 2026-07-30:

| Record | Value |
|---|---|
| Registrar | Squarespace Domains (expires 11 Jun 2027) |
| Nameservers | `nse1–4.squarespacedns.com` |
| Apex A | Squarespace hosting (`198.185.159.144/145`, `198.49.23.144/145`) — serving a "Coming Soon" page |
| `www` | CNAME → `ext-sq.squarespace.com` |
| MX | `mxa.mailgun.org`, `mxb.mailgun.org` (priority 10) |
| SPF | `v=spf1 include:mailgun.org ~all` |
| `mail.seal-shot.com` | **no records at all** |

- [x] **Find where Mailgun currently forwards `support@seal-shot.com`.**
      This is the single most important unknown — the MX change in Phase 3
      abandons that forwarding, and `support@` is printed on the support page.
      **Finding:** MX is Mailgun, and the zone carries an RSA DKIM key at
      `mailo._domainkey` — so the forwarding almost certainly terminates in a
      **Mailo** mailbox. Confirm the destination address in the Mailgun
      dashboard (Receiving → Routes) before Phase 3 replaces the MX.
- [ ] Log into the Squarespace DNS panel and screenshot the full record list
      (external lookups can't see everything).
- [ ] Note anything else using the Squarespace site that would break.

### Migrate

- [x] Cloudflare dashboard → **Add a site** → `seal-shot.com` → **Free** plan
- [x] Let Cloudflare scan, then **compare its imported records against the
      table above.** Confirm specifically:
  - [x] MX → both `mxa`/`mxb.mailgun.org`
  - [x] TXT → the SPF record
- [x] Add anything missing **by hand now**, while the old nameservers are
      still authoritative
- [x] Change nameservers at Squarespace to Cloudflare's two
- [x] Wait for the zone to show **Active** (usually under an hour)

**Verify:** `dig +short NS seal-shot.com` returns Cloudflare nameservers, and
`dig +short MX seal-shot.com` still returns the Mailgun (or new) MX.

**Verified 2026-08-01:** nameservers are `angela` / `lamar.ns.cloudflare.com`
(SOA is Cloudflare, zone updated 20:40 UTC); MX, SPF and the `mailo` DKIM key
all survived the import.

### Registrar transfer — separate, and not required

The registration is **still with Squarespace Domains** and still carries
`clientTransferProhibited`. That is fine: nameserver delegation is what makes
Cloudflare authoritative, and it is already done, so nothing below is blocked
on this. Moving the registration to Cloudflare Registrar needs the lock lifted
and an auth code from Squarespace, and can happen any time before the
June 2027 renewal.

**Do not cancel the Squarespace site subscription yet.** If the domain was
bundled with an annual plan, cancelling can put the free domain at risk.
Confirm the domain is billed separately first.

---

## Phase 2 — Custom domain + Access

Depends on Phase 1 being Active.

**Order matters.** Extend Access *before* attaching the domain. Attaching it
creates a proxied record that starts serving the real site immediately, while
the Access application still covers only `sealshot-website.pages.dev` — so
doing it the other way round leaves the unfinished site publicly readable for
as long as the gap lasts. Adding the destinations first costs nothing: they
stay inert until a proxied record for the hostname exists.

- [ ] Zero Trust → **Access controls → Applications** → your app →
      **Destinations**: add `seal-shot.com` (subdomain blank) and
      `*.seal-shot.com`
- [ ] Pages project → **Custom domains** → add `seal-shot.com`
- [ ] Add `www.seal-shot.com` too. It redirects rather than serves, but it
      still needs its own certificate — without one, `https://www.…` fails at
      TLS before any redirect can fire.
- [ ] Cloudflare will flag the conflicting Squarespace records; let it replace
      them, then **re-check DNS**: the four apex `A` records and the `ext-sq`
      CNAME should be gone, and MX / SPF / `mailo._domainkey` still present.
- [ ] Confirm TLS certificates issue (automatic, a few minutes)
- [ ] **This replaces the Squarespace "Coming Soon" page** — the real site
      takes over, still behind Access
- [ ] Rules → **Redirect Rules**: hostname equals `www.seal-shot.com` →
      `concat("https://seal-shot.com", http.request.uri.path)`, 301, preserve
      query string.

Apex is canonical because `astro.config.mjs` sets `site:
'https://seal-shot.com'`, which drives the sitemap and canonical tags. But the
app ships `buyURL = "https://www.seal-shot.com/buy"`
(`LicenseKeys.swift:27`) — the **www** form. The redirect preserves the path,
so the in-app Buy button still reaches `/buy` and the app needs no change.
Skip the redirect rule and that button breaks.

**Verify.** These three must return `302` to `…cloudflareaccess.com`:

```
curl -sI https://seal-shot.com/docs/
curl -sI https://sealshot-website.pages.dev/docs/
curl -sI https://<some-preview-hash>.sealshot-website.pages.dev/
```

A `200` on any of them means that hostname is publicly readable.

`www` is the interesting one. Whether the redirect or the Access gate fires
first is not something to assume — just look:

```
curl -sI  https://www.seal-shot.com/buy      # 301 → apex, or 302 → Access?
curl -sIL https://www.seal-shot.com/buy      # follow it all the way
```

Either order is acceptable. If Access wins, a logged-out visitor to `www`
authenticates for `www.seal-shot.com`, gets redirected to the apex, and may be
asked to authenticate again for `seal-shot.com` — mildly annoying during the
private phase, and irrelevant once Access comes off at launch. What must hold
in both orders is that **`/buy` survives the redirect**, because that is where
the app's Buy button points.

- [x] Also confirm mail still resolves after the record surgery:
      `dig +short MX seal-shot.com` returns both Mailgun hosts.
- [ ] Delete the leftover `_domainconnect` CNAME (→
      `_domainconnect.domains.squarespace.com`). Harmless, but it is what lets
      Squarespace's Domain Connect flow reconfigure records, and nothing needs
      it now.

**Verified 2026-08-01:** apex and `www` are both proxied CNAMEs to
`sealshot-website.pages.dev`, certificates valid for both, and both return
`302` to `…cloudflareaccess.com`. No redirect rule existed at the time of this
check, so `www` was serving rather than redirecting.

- [ ] Confirm the Access policy allows **specific emails**, not "all
      authenticated users" — with one-time PIN as the only identity provider,
      "all authenticated users" means anyone who can receive a PIN
- [ ] Set session duration (1 week is comfortable for testers)

---

## Phase 3 — Email infrastructure

Depends on Phase 1. Independent of Phase 4, so it can run in parallel.

### Read this first — the zone already enforces strict DMARC

The imported zone carries a DMARC record nobody on this project wrote:

```
v=DMARC1; p=reject; pct=100; fo=1; ri=3600; sp=reject;
adkim=s; aspf=s;
rua=mailto:…@dmarc.mailgun.org,mailto:…@inbox.ondmarc.com
ruf=…
```

Three parts of that change how carefully the rest of this phase must be done:

- **`p=reject` / `sp=reject`** — a message that fails DMARC is *rejected at the
  receiving server*, not filed in spam. A misconfiguration here does not
  degrade deliverability; it stops mail entirely, and the buyer never sees a
  licence. `sp=reject` means the policy applies to `mail.seal-shot.com` too.
- **`aspf=s`** (strict SPF alignment) — the SPF-authenticated domain must
  *exactly* equal the From domain. Sending as `license@mail.seal-shot.com`
  therefore needs an SPF record **on `mail.seal-shot.com` itself**; inheriting
  the apex SPF does not satisfy strict alignment.
- **`adkim=s`** (strict DKIM alignment) — the DKIM signature's `d=` must
  exactly equal `mail.seal-shot.com`. Resend's subdomain setup does produce
  this, provided its DKIM record goes under the subdomain.

The `rua`/`ruf` reports go to Mailgun and OnDMARC addresses. If you can't read
those mailboxes you will get no failure reports, which makes the verification
steps below the only feedback loop you have.

None of this affects Polar sandbox testing, which sends from `resend.dev`
under its own DMARC policy.

### Human mail — Workspace alias domain

- [ ] Admin console → **Account → Domains → Manage domains → Add a domain →
      User alias domain** → `seal-shot.com`
- [ ] Add the verification **TXT** record in Cloudflare DNS
- [ ] Change **MX** to Google (`smtp.google.com`) — **this is the destructive
      step that ends the Mailgun forwarding recorded in Phase 1**
- [ ] Update **SPF** to `v=spf1 include:_spf.google.com ~all`
- [ ] Enable **DKIM** for the alias domain and add its TXT record. Not
      optional — with `adkim=s` and `p=reject`, mail sent as
      `support@seal-shot.com` without a `d=seal-shot.com` signature is
      rejected, not spam-filed.
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
- [ ] Add the records Resend generates, in Cloudflare DNS — all of them
      **under `mail.seal-shot.com`**, not the apex, or strict alignment fails:
  - [ ] TXT (SPF) on the subdomain
  - [ ] TXT (DKIM) on Resend's selector
  - [ ] MX on the subdomain (routes bounces back to Resend)
- [ ] Leave the apex DMARC record alone. It is already stricter than anything
      we would add, and `sp=reject` already covers the subdomain.
- [ ] Wait for Resend to show the domain **Verified**
- [ ] Create the API key → this becomes the `RESEND_API_KEY` secret in Phase 4

**Verify:** send a test email from the Resend dashboard as
`license@mail.seal-shot.com` to a real inbox — ideally one outside Google, so
you are not only testing the friendliest receiver. Then open the raw headers
and confirm **three** things, not two:

- `spf=pass` **and** the SPF domain is `mail.seal-shot.com` (not the apex)
- `dkim=pass` **and** `d=mail.seal-shot.com`
- `dmarc=pass`

With `adkim=s`/`aspf=s`, a `pass` on the wrong domain still fails alignment,
and `p=reject` turns that into a bounce. Checking only "did it arrive" will
not catch it — a message can arrive from a lenient receiver and be rejected by
a strict one.

---

## Phase 4 — Purchase and fulfilment

**The riskiest phase.** Failures here mean a customer pays and receives
nothing. Nothing in this phase is live today — the checkout URL is a
placeholder, so there is no way to accidentally take money before it's ready.

### Known gaps to fix in code first

- [x] **Delivery decoupled from the webhook.** The handler now records the
      order in KV, answers **200**, and delivers in `ctx.waitUntil()`. A
      **cron trigger** (`*/5 * * * *`) retries anything still `pending`, with
      backoff doubling from 5 minutes to a 4-hour cap and giving up after 48
      hours. Retries are ours, on a schedule we control.

      **This makes the timestamp question moot** — Polar's redelivery
      behaviour no longer decides whether an order gets fulfilled. The stale
      gate was also widened from 300 s to **24 h**, since idempotency is the
      real replay defence and a tight window risked Polar disabling the
      endpoint. A 500 is now returned *only* when the order couldn't be
      recorded at all, which is the one case where redelivery is what we want.

- [x] **`reply_to` added** — `REPLY_TO` var, default `support@seal-shot.com`,
      so buyer replies reach a real inbox instead of bouncing off the
      send-only subdomain. **Needs Phase 3 done to actually receive.**

- [x] **Alerting added.** `console.error` always (reaches `wrangler tail` and
      Workers Logs, and Cloudflare notifications can fire on Worker errors),
      plus an email to `ALERT_EMAIL` when set — once when an order has been
      undelivered 30 minutes, and again if we give up. Enable `ALERT_EMAIL`
      in `wrangler.toml` once `support@` can receive.

- [ ] **Still worth running the timestamp test once**, purely to know: point
      the webhook at an endpoint returning 500, trigger an order, and see
      whether retry #3 carries a fresh `webhook-timestamp`. No longer a
      blocker — just useful to have recorded.
      **Finding:** _______________________________________________

- [ ] Consider **Resend Pro ($20/mo)** for launch — removes the 100/day cap
      so a spike day can't fail sends. Mitigation, not a substitute for the
      retry work above.

### Deploy

**None of this waits on the domain.** Deploy to the `workers.dev` route and
the whole purchase path can be built and tested while DNS is still moving —
see "Test before the domain exists" below.

Run everything from `workers/license-fulfillment`, and use `npx wrangler`
(wrangler isn't on the global PATH).

- [x] **Prove the signing key first.** `npx vitest run production-key` asserts
      the Keychain key is the private half of key 1 in `LicenseKeys.swift`, and
      that an issued licence verifies against the app's embedded public key.
      Without this, every licence sold could be rejected at activation and no
      other test would notice. **Verified 2026-08-01: passes.**
- [x] `npx wrangler kv namespace create ORDERS` → bound in `wrangler.toml`
      (`7c0ac7b21f5e4223b4c585f73c3408a2`), confirmed by dry-run
- [ ] **`SIGNING_KEY_B64`** — pipe it from the Keychain so it never appears on
      screen or in shell history:

      security find-generic-password -s com.seal-shot.licensegen -a primary -w \
        | xxd -r -p | base64 | npx wrangler secret put SIGNING_KEY_B64

- [ ] **`RESEND_API_KEY`** — `npx wrangler secret put RESEND_API_KEY`
- [ ] Deploy to the **`workers.dev`** route. **Keep the Worker off any
      Access-gated hostname** (or add a bypass / Service Auth policy) — Polar's
      webhooks can't answer a login challenge, and `workers.dev` sits outside
      the Access application entirely.
- [ ] Create the Polar product and paste the **real checkout URL** into
      `src/config/promos.ts` (`BASE_CHECKOUT_URL`, and any promo entries) —
      it's still the `<product-checkout-id>` placeholder, which is why nobody
      can accidentally buy anything today
- [ ] Register the webhook endpoint in Polar (the `workers.dev` URL +
      `/webhooks/polar`) and **`npx wrangler secret put POLAR_WEBHOOK_SECRET`**
      with the signing secret Polar generates. This secret doesn't exist until
      the endpoint does, which is why Polar setup comes last here.
- [ ] Once Phase 3 is done: set `EMAIL_FROM` to the verified
      `mail.seal-shot.com` address, and uncomment `ALERT_EMAIL`

### Test before the domain exists

`mail.seal-shot.com` has no DNS yet, but delivery doesn't have to wait:

- [ ] Temporarily set **`EMAIL_FROM` to Resend's test sender**
      (`onboarding@resend.dev` — confirm the exact address in your Resend
      dashboard). It can send to your own account address with no domain
      verification, which is enough to exercise the entire chain: webhook →
      licence generation → email with attachment → **activation in the app**.
- [ ] Run the full test list below against that setup
- [ ] Switch `EMAIL_FROM` to the real address after Phase 3 and re-run one
      purchase to confirm nothing depended on the test sender

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
- [ ] **Email failure** (temporarily bad API key) → webhook still returns
      **200**, order stored `pending` with `attempts: 1` and a `lastError`.
      Fix the key, then confirm the cron delivers it within ~5 minutes and the
      record flips to `sent` with the **same** `licenseId`. Watch it with
      `npx wrangler tail`.
- [ ] **Alerting** → leave an order failing for 30+ minutes and confirm the
      `[fulfilment-alert]` line appears in `wrangler tail` (and an email, once
      `ALERT_EMAIL` is set)
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
