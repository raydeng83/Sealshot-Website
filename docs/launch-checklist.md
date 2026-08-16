# Pre-launch checklist — seal-shot.com

Everything that must work before the site goes public and the first real sale
happens. Written 2026-07-31; launch target a few weeks out.

**How to use this:** the phases are ordered by dependency, not importance.
Phase 1 has the longest lead time (DNS propagation) so it starts first;
Phase 4 is the riskiest and needs the most testing. Tick items as you go and
record the answers in the "Findings" blanks — several later steps depend on
them.

**Current state:** site deploys from `main` to Cloudflare Pages, gated by
Cloudflare Access, and live on `seal-shot.com`. Docs are complete and audited
against the app. The purchase path is proven end to end in Polar's sandbox
(see Phase 4). Production Polar is not set up.

---

## Gate 0 — before a single sale, or a single public claim

No amount of ticking below substitutes for these three. Each is currently
**unverified**, and each would be discovered by a customer or by Hacker News
rather than by us.

### G0.1 — The app must accept what the Worker issues

- [ ] **Cut a Direct release containing licensing v2.**

The Worker now emits license **preamble v2**. The newest tagged release is
**v0.7.2**, which verifies **v1**. So a purchase made today produces a file
that the app the customer just downloaded rejects as `textTampered` — they pay
and cannot activate.

There is a second reason the release must come first: a founding buyer's
18-month window is compared against the **build's** entitlement date, which is
stamped at release time. Sell before the release exists and the arithmetic has
nothing to measure against.

**Verify:** buy through sandbox Polar, then activate the emailed license on the
release build downloaded from its public URL — not a local build.

### G0.1a — Publish the revocation blocklist

- [ ] Commit `license-blocklist.json` to the **Sealshot-Release** repo.

`https://raw.githubusercontent.com/.../main/license-blocklist.json` currently
returns **404**. The shipped app fetches it on launch, fails open silently, and
carries on — so nothing is visibly broken, but **revocation does not work at
all**, and `/refunds` now promises that it does.

An initial signed file with an empty `revoked` list is enough; `licensegen
revoke --id …` appends to it thereafter. Note `licensegen revoke` cannot create
the file, because it requires an `--id`.

**Published 2026-08-03** (`Sealshot-Release` `405ca8b`) — empty list, signed with
key 1, verified against the public key the app embeds.

- [ ] **To revoke a license, use the wrapper** rather than the four steps by hand:

      cd workers/license-fulfillment && npm run revoke -- <license-uuid>

      It cross-checks KV that the license really was refunded (refusing without
      `--force`), signs via `licensegen`, verifies before publishing, commits,
      pushes, and confirms the published file through the GitHub **API** — which
      is uncached, unlike `raw.githubusercontent.com`, whose ~5 minute TTL means a
      revocation is not fetchable by apps immediately. `--dry-run` signs and
      verifies without touching the repo.

- [ ] To check the published list at any time:

      cd workers/license-fulfillment && npm run verify:blocklist

      It fetches the live file and checks it the way the app does: known signing
      key, signature over the comma-joined sorted ids, sorted list, all five
      non-optional fields. Add `--expect <uuid>` to assert a specific id landed.

This check is not optional politeness. `BlocklistFetcher` fails open by design,
so a 404, a malformed file, or an id added by hand without re-signing all
degrade silently to "revokes nothing" — indistinguishable from "nothing has been
revoked yet", which is precisely how the URL stayed 404 unnoticed.

### G0.1b — The privacy policy depends on this release

The policy states that the revocation download follows the "Automatically check
for updates" setting. That gating exists on the app repo's `development` branch
but is **not in any released build** — 0.7.2 fetches unconditionally.

The ordering happens to be safe: G0.1 requires a release before any sale, that
release comes from the same branch, and the site is behind Access until launch,
so no external reader sees the policy first. Worth checking rather than assuming
when the release is cut.

- [ ] Confirm the release containing licensing v2 also contains the blocklist
      gating (`AppDelegate.swift`, guarded on
      `UpdaterController.shared.automaticallyChecksForUpdates`).

### G0.2 — Redaction must be proven permanent

- [ ] **Attack your own export.** Redact something identifiable, export, then
      try to recover it: another editor, hard zoom, levels and contrast.
- [ ] **Do it for a `.seal` package too.** The suspected failure is asymmetric —
      the flat PNG is clean while the layered package still carries the
      original underneath, so sharing the package leaks what sharing the PNG
      does not.

The whole go-to-market message is "share screenshots without sharing secrets".
If someone recovers redacted content from an export after launch, that is not a
bug report — it ends the positioning. See §4.4 of `docs/testing-manual.md`.

### G0.3 — Network silence must be proven

- [ ] **Watch the app with Little Snitch or a proxy** through a full session:
      capture, edit, OCR, AI features, library search, export. Exactly three
      requests are permitted, and **all three are downloads** — the privacy
      policy names them and commits to there being no others:
      1. the daily **update check** (Sparkle appcast on the release repo);
      2. the **revocation blocklist** on launch —
         `license-blocklist.json`, a plain download of the whole list, checked
         on-device. It follows the "Automatically check for updates" setting,
         so turning that off must stop this too;
      3. the **redaction model**, only if you enable it, once, on consent.
- [ ] **Confirm what is *not* in those requests.** The claim is not merely "few
      requests" — it is that nothing identifying leaves the Mac. No license ID,
      no license file contents, no account, no device identifier, no usage data,
      and never capture content. The blocklist fetch is the one to inspect
      closely: it asks for a static file and must carry no query string, custom
      header, or body naming the license it is about to check.
- [ ] **Two things that will look like violations and are not.** Expect them,
      and do not record them as failures:
      - Clicking **Buy** or **Renew** opens `seal-shot.com` in your *browser*.
        Sealshot issues no request; your browser does, because you asked it to.
        Note that the renew link does carry your license ID and email as query
        parameters, so a packet capture will show them leaving the machine at
        that moment — user-initiated, to our own site, for the renewal itself.
      - `https://sealshot.app/ns/1.0/` appears in the sources
        (`AnnotatedPNGIO.swift`) and is **never fetched** — it is an XMP
        namespace identifier, which is a name, not an address.
- [ ] Consider **publishing the result**. Almost no competitor can, and Show HN
      readers will run this test whether or not you do.

"No telemetry" is the product's core claim and the privacy policy commits to
it in writing. It has never been verified at the packet level.

The permitted list is three, not two: the revocation download (G0.1a) was added
after this gate was first written, and `privacy.astro` was updated to say
"exactly three network requests" while this item still said two. A tester
working from the old wording would flag a disclosed, expected request as a
violation of the very claim being tested.

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

### Read this first — DMARC is NOT enforcing

The apex publishes a permissive record. Checked live 2026-08-10:

```
v=DMARC1; p=none;
```

Earlier revisions of this checklist described the zone as carrying
`p=reject; pct=100; fo=1; ri=3600; sp=reject; adkim=s; aspf=s` plus `rua`/`ruf`
reporting to Mailgun and OnDMARC addresses, and the rest of this phase was
written against that stricter policy. **That is not what is published.** The
record was relaxed at some point — most likely during the Google Workspace
migration, where dropping to `p=none` is the normal precaution. Treat any
remaining "it will be rejected" warning below as describing a policy that is
not currently in force.

What the live record actually means:

- **`p=none`** — nothing is rejected on DMARC grounds. A misaligned message
  degrades to the spam folder instead of being refused at the receiving server.
  That makes this phase more forgiving than it reads, but it cuts both ways: a
  misconfiguration will not announce itself.
- **No `sp=`** — subdomains inherit `p=none`, so `mail.seal-shot.com` is
  unenforced too.
- **No `adkim=`/`aspf=`** — alignment is relaxed by default, so a DKIM or SPF
  pass on `seal-shot.com` aligns for its subdomains as well. Strict alignment
  is not the reason to put records under the subdomain (see below for the
  reason that still holds).
- **No `rua`/`ruf`** — no aggregate or forensic reports are collected anywhere,
  so there is no passive feedback loop. The verification steps below are the
  only signal you get.

**Decide before launch whether that is what you want.** As published, nothing
discourages a third party from spoofing `seal-shot.com`. The conventional path
is `p=none` *with* `rua` for a week or two to confirm every legitimate sender
aligns, then `p=quarantine`, then `p=reject` — the state this document
previously assumed was already reached.

Keep every Resend record **under `mail.seal-shot.com`** regardless. Relaxed
alignment no longer forces it, but Resend requires it to verify the domain, and
it keeps license-mail reputation separate from the apex that carries your
Workspace mail.

None of this affects Polar sandbox testing, which sends from `resend.dev`
under its own DMARC policy.

### Human mail — Workspace alias domain

- [ ] Admin console → **Account → Domains → Manage domains → Add a domain →
      User alias domain** → `seal-shot.com`
- [ ] Add the verification **TXT** record in Cloudflare DNS
- [ ] Change **MX** to Google (`smtp.google.com`) — **this is the destructive
      step that ends the Mailgun forwarding recorded in Phase 1**
- [ ] Update **SPF** to `v=spf1 include:_spf.google.com ~all`
- [ ] Enable **DKIM** for the alias domain and add its TXT record. Still worth
      doing even under `p=none`: DKIM survives forwarding where SPF does not,
      and it is the prerequisite for ever moving to `p=quarantine`/`p=reject`
      without breaking `support@seal-shot.com`.
- [ ] Create a free **Google Group** `support@bostonidentity.com` (alias
      domains mirror existing usernames, so this is what makes
      `support@seal-shot.com` exist)

**Verify:**
- [ ] Send from an outside address to `support@seal-shot.com` → arrives
- [ ] **Reply as** `support@seal-shot.com` from Gmail → recipient sees the
      seal-shot.com address, not your personal one
- [ ] `dig +short MX seal-shot.com` shows Google

### `licensing@` must land somewhere

- [ ] Create `licensing@seal-shot.com` and put it in front of a person.

Volume licenses are quoted and invoiced by hand, and the FAQ already promises
business licensing. A launch that drives one business enquiry to an address
nobody reads loses the largest order available — volume starts at ten seats.

### Transactional — Resend on `mail.seal-shot.com`

- [x] Resend account → **Add domain** → `mail.seal-shot.com` (uses the one
      domain the free tier allows). **Done 2026-08-10.** The account is
      registered under `ray.deng83@gmail.com`, not the bostonidentity address.
- [x] Add the records Resend generates, in Cloudflare DNS — all of them
      **under `mail.seal-shot.com`**, never the apex. The apex belongs to
      Google Workspace, and merging Resend's SPF into it would break human
      mail. **Verified live 2026-08-10:**
  - [x] TXT (SPF) → `send.mail.seal-shot.com`, `v=spf1 include:amazonses.com ~all`
  - [x] TXT (DKIM) → `resend._domainkey.mail.seal-shot.com`
  - [x] MX → `send.mail.seal-shot.com`, `feedback-smtp.us-east-1.amazonses.com`
        (routes bounces back to Resend)
- [ ] Leave the apex DMARC record alone unless you are deliberately tightening
      it — see the DMARC note at the top of this phase. It is `p=none`, so it
      constrains nothing here.
- [x] Wait for Resend to show the domain **Verified** — confirmed by delivery,
      2026-08-10
- [x] Create the API key → this becomes the `RESEND_API_KEY` secret in Phase 4

**Verify:** send a test email from the Resend dashboard as
`license@mail.seal-shot.com` to a real inbox — ideally one outside Google, so
you are not only testing the friendliest receiver. Then open the raw headers
and confirm **three** things, not two:

- `spf=pass` **and** the SPF domain is `mail.seal-shot.com` (not the apex)
- `dkim=pass` **and** `d=mail.seal-shot.com`
- `dmarc=pass`

Under today's relaxed alignment a `pass` on the apex would still align, so
none of this is load-bearing yet — but check it anyway. These three are exactly
what has to be true *before* the policy is ever tightened, and confirming them
now is far cheaper than discovering at `p=reject` that license mail was only
ever aligning by the apex's grace.

---

## Phase 4 — Purchase and fulfilment

**The riskiest phase.** Failures here mean a customer pays and receives
nothing.

### ✅ Proven end to end in SANDBOX, 2026-08-02

Two founding purchases went the whole way: Polar checkout → `order.paid`
webhook (200) → `PRODUCT_MAP` resolving the **18-month** founding term
(issued 2026-08-02, `updatesThrough` 2028-02-02, so it matched the real product
id rather than falling through to the 12-month default) → license minted with
preamble v2 → Resend delivery → **activated in the app**. Both delivered on the
first attempt. Worker logs across the window: 0 alerts, 0 exceptions.

Activation was tested via "Open License File…" rather than drag-and-drop. Those
paths converge on the same `activateFile(at:)`, so everything from reading the
file through signature, `textHash` and payload decode is identical — only
`handleLicenseFileDrop`'s own `NSItemProvider` handling is still unexercised.

What sandbox has NOT exercised, and still needs doing before launch:

- [ ] **Five real purchases of your own**, on clean machines, with five
      different email addresses, at the real price. The founding cohort's design
      partners are free, so without this the first exercise of the *paid* path
      is a stranger's money. Cheapest possible de-risking — do it before any
      external sale.
- [ ] A **renewal** purchase — `reference_id` propagation, reusing the license
      id, and extending rather than resetting the window. Covered by tests, not
      by live traffic.
- [x] The **retry/backoff** path. **Exercised for real 2026-08-10**: three
      sandbox orders failed their first sends, were retried by the cron with
      the delay doubling 5 → 10 → 20 → 40 min, and two delivered on the tick
      after the sender was fixed — reusing their original license ids rather
      than minting new ones, which is the frozen-window guarantee holding under
      live conditions. The 48-hour give-up branch is still untested.
- [x] Delivery to an address other than the Resend account owner. **Proven
      2026-08-10** to two `@bostonidentity.com` addresses, once
      `mail.seal-shot.com` was verified and `EMAIL_FROM` restored.
- [ ] The **production** swap. See the Phase 7 blocker list; sandbox passing
      says nothing about production config being right.

### Known gaps to fix in code first

- [x] **Delivery decoupled from the webhook.** The handler now records the
      order in KV, answers **200**, and delivers in `ctx.waitUntil()`. A
      **cron trigger** (`*/5 * * * *`) retries anything still `pending`, with
      backoff doubling from 5 minutes to a 4-hour cap and giving up after 48
      hours. Retries are ours, on a schedule we control.

      **This makes the timestamp question moot** — Polar's redelivery
      behavior no longer decides whether an order gets fulfilled. The stale
      gate was also widened from 300 s to **24 h**, since idempotency is the
      real replay defence and a tight window risked Polar disabling the
      endpoint. A 500 is now returned *only* when the order couldn't be
      recorded at all, which is the one case where redelivery is what we want.

- [x] **`reply_to` added** — `REPLY_TO` var, default `support@seal-shot.com`,
      so buyer replies reach a real inbox instead of bouncing off the
      send-only subdomain. **Receiving confirmed 2026-08-10**: the apex MX
      points at Google Workspace and `support@seal-shot.com` delivers to
      `le.deng@bostonidentity.com`.

- [x] **Alerting turned ON, 2026-08-03.** It was written earlier but disabled:
      `ALERT_EMAIL` was commented out and `[observability]` was absent, so every
      alert existed only for the duration of a live `wrangler tail`. The refund
      alert on 3 August was lost exactly that way. Both are now set.
      `ALERT_EMAIL` moved to `support@seal-shot.com` on **2026-08-10**, in the
      same edit that restored `EMAIL_FROM`, as it had to be: under the test
      sender only the account owner was reachable, so pointing it at support@
      any earlier would have silenced every alert. The 30-minute undelivered
      alert fired correctly during that day's incident.
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
      that an issued license verifies against the app's embedded public key.
      Without this, every license sold could be rejected at activation and no
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
- [ ] **Subscribe to BOTH `order.paid` and `order.refunded`.** The refund
      handler exists and is tested, but Polar sends refunds as a separate event
      — subscribe to `order.paid` alone and a refund stays invisible: the order
      keeps its `sent` state, the license record stays valid, and a later
      renewal would silently reinstate a license you meant to revoke.
      with the signing secret Polar generates. This secret doesn't exist until
      the endpoint does, which is why Polar setup comes last here.
- [x] Once Phase 3 is done: set `EMAIL_FROM` to the verified
      `mail.seal-shot.com` address, and point `ALERT_EMAIL` at
      `support@seal-shot.com`. **Done 2026-08-10**, both in one edit as the
      config requires.

### Test before the domain exists — closed 2026-08-10

Kept as a record of how the sandbox path was exercised before
`mail.seal-shot.com` existed, and of what that arrangement cost.

- [x] Temporarily set **`EMAIL_FROM` to Resend's test sender**
      (`onboarding@resend.dev`). It reaches the Resend account owner's address
      and no other, which was enough to exercise the whole chain: webhook →
      license generation → email with attachment → **activation in the app**.
- [x] Run the full test list below against that setup
- [x] Switch `EMAIL_FROM` to the real address after Phase 3 and re-run one
      purchase to confirm nothing depended on the test sender

⚠️ **What this cost, so it is not repeated.** The test sender's
owner-address-only restriction is silent: Resend answers `403` and the Worker
records the order `pending`, so a buyer at any other address simply receives
nothing. On 2026-08-10 three sandbox purchases made with `@bostonidentity.com`
addresses stalled exactly this way, and the diagnosis needed the KV order
records because the Worker logged only `email HTTP 403` — it discarded the
response body that said, in plain words, what was wrong. The Worker now keeps
that body. **Never point `EMAIL_FROM` back at a test sender while anyone but
the account owner might buy.**

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
  - [ ] `PUBLIC_KIT_FORM_ID` — without it the form is replaced by a link to the
        GitHub releases page, so the section degrades instead of showing a
        heading with no input under it. There is still no signup anywhere, which
        is the point of this step
  - [ ] Authenticate the sending domain with Kit **before** setting this. DMARC
        is `p=none` today, so an unaligned confirmation from
        `news.seal-shot.com` is spam-foldered rather than rejected outright —
        but a double opt-in confirmation landing in spam is still a subscriber
        lost, and it is the one message that has to arrive. If the policy is
        later tightened as the Phase 3 note suggests, unaligned becomes
        **rejected** and this stops being a soft failure
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

### Refund terms — publish before taking money

- [ ] Publish `/refunds`, and link it from `/buy` and the footer.

CleanShot X — the closest comparator, at the same price — publishes a **30-day
money-back guarantee**. Sealshot publishes nothing. Taking money from strangers
without stated terms is a support burden and a competitive gap at once, and the
"refunds under 5%" number tracked below is meaningless without a policy defining
what a refund is.

Polar is merchant of record so Polar processes it; the terms are still ours to
state.

### Privacy policy

- [x] **Rewritten 2026-08-02** (`946ddb3`). The "no cookies, no trackers, and
      no analytics" sentence now describes Cloudflare Web Analytics honestly,
      and a new **Buying a license** section covers Polar as merchant of
      record, exactly what the Worker stores in KV, Resend holding the sent
      message *including the attached license file*, retention for the life of
      the license, and deletion on request.
- [x] App section left unchanged — "no telemetry, no account" is still true and
      is the product's core claim.
- [ ] Add a **subscriber list** paragraph: provider, what's stored, how to
      unsubscribe, how to be deleted. *(Still outstanding — the newsletter
      paragraph predates Kit being confirmed.)*

> ⚠️ **The policy now describes analytics that are not yet running.** That was
> a deliberate call: the site is behind Access, so no member of the public can
> read the policy at all, and over-disclosure is the safe direction. But it
> means **Cloudflare Web Analytics must be enabled before Access comes off** —
> otherwise the first public version of the policy claims a service that isn't
> there. Not credibility-damaging like the reverse would be, but wrong.
>
> Enforced by the Phase 7 gate below.

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
      `capture-window.jpg` (8.4 MB) — biggest page-weight items on the site
- [ ] Update the consolidated PDF (`output/README.md` has the steps) if you
      want the launch edition to match the shipped docs

---

## Phase 7 — Go public

### Blockers that are already written into the code, and fail silently

Each of these is committed and marked in-file. None of them errors — that is
exactly why they need a checklist.

- [ ] **`src/config/promos.ts`** — replace the three **sandbox** checkout URLs
      with production ones and set `CHECKOUT_IS_SANDBOX = false`. A test fails
      if the flag and the URLs disagree, so a half-done swap can't ship.
- [ ] **`PRODUCT_MAP` in `workers/license-fulfillment/wrangler.toml`** — swap
      sandbox product ids for production ones. Nothing fails if you forget:
      every purchase quietly resolves to a 12-month new license, so a founding
      buyer silently loses six months and a renewal mints a *second* license.
      The only signal is the unmapped-product alert.
- [ ] **`POLAR_WEBHOOK_SECRET`** — set to the *production* endpoint's secret.
      Leave the sandbox one and every real webhook returns 401; after ten
      consecutive failures Polar disables the endpoint and orders go
      unfulfilled with no error anywhere.
- [x] **`EMAIL_FROM` in `wrangler.toml`** — `license@mail.seal-shot.com`,
      restored and deployed **2026-08-10** once `mail.seal-shot.com` verified,
      together with `ALERT_EMAIL` → `support@seal-shot.com`. No longer a
      blocker; listed here because reverting it to a test sender would silently
      strand every buyer who is not the Resend account owner.
- [ ] **Enable Cloudflare Web Analytics** — the privacy policy already
      describes it. See the Phase 5 note.

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
