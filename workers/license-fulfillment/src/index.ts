import { verifyPolarSignature, parseOrderPaid, parseOrderRefunded } from './polar';
import {
  getOrder, putOrder, listPending, getLicense, putLicense, type OrderRecord,
} from './store';
import { hasUnsafeChars } from './sanitize';
import { deliverLicense, isDue, type FulfillEnv } from './fulfill';
import { handleVerify, corsHeaders, type VerifyEnv } from './verify';
import { handleFeedback, type FeedbackEnv } from './feedback';
import { resolveProduct, renewalThrough, isMappedProduct } from './product';
import { resolveRenewalTarget } from './renewal';
import { addMonthsUTC } from './license';
import { alert } from './alert';

export interface Env extends FulfillEnv, VerifyEnv, FeedbackEnv {
  ORDERS: KVNamespace;
  SIGNING_KEY_B64: string;
  POLAR_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  REPLY_TO?: string;
  ALERT_EMAIL?: string;
  PRODUCT_MAP?: string;
  FETCH?: typeof fetch; // test injection only
}

function isoToUTCDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Signature timestamps older than this are rejected as stale. Generous on
 * purpose: idempotency is the real replay defence (an order already `sent`
 * returns 200 without re-emailing), while a tight window would reject genuine
 * webhook redeliveries whose backoff outlasts it — and enough consecutive
 * non-2xx responses gets the endpoint disabled at Polar.
 */
const MAX_TIMESTAMP_SKEW_SECONDS = 24 * 60 * 60;

/**
 * Record a refund and tell a human to revoke the licence.
 *
 * Deliberately does NOT revoke anything itself. Revocation means publishing the
 * licence id in the signed blocklist that the app downloads, which lives in the
 * Sealshot-Release repo — a git commit this Worker cannot make. So the Worker's
 * job is to make the refund impossible to miss, and to stop the licence being
 * reinstated by a later renewal.
 *
 * Idempotent: a redelivered refund event finds the order already `refunded` and
 * returns without alerting twice.
 */
async function handleRefund(env: Env, orderId: string): Promise<void> {
  const order = await getOrder(env.ORDERS, orderId);

  if (!order) {
    // A refund for an order we never recorded — refunded before the endpoint
    // existed, or a delivery that failed so completely nothing was stored.
    // Worth knowing about precisely because we cannot act on it.
    await alert(env, {
      subject: `Sealshot: refund for an unknown order ${orderId}`,
      body:
        `Polar reports order ${orderId} refunded, but there is no order record.\n` +
        `Nothing to revoke from this side — check the order in Polar to see\n` +
        `whether a licence was ever issued for it.`,
    });
    return;
  }

  if (order.state === 'refunded') return; // already handled

  await putOrder(env.ORDERS, orderId, { ...order, state: 'refunded' });

  // Flag the licence so a later renewal cannot quietly reinstate it. Skipped
  // when the order never got as far as having a licence id.
  if (order.licenseId) {
    const lic = await getLicense(env.ORDERS, order.licenseId);
    if (lic) await putLicense(env.ORDERS, order.licenseId, { ...lic, refunded: true });
  }

  await alert(env, {
    subject: `Sealshot: refund — revoke licence ${order.licenseId || '(none issued)'}`,
    body:
      `Order ${orderId} was refunded.\n` +
      `  licence: ${order.licenseId || '(none issued)'}\n` +
      `  buyer:   ${order.email}\n` +
      `  issued:  ${order.issued}, updates ${order.updatesThrough || 'permanent'}\n\n` +
      `Recorded as refunded, and the licence is flagged so a renewal cannot\n` +
      `reinstate it. REVOCATION IS STILL MANUAL — the app checks a signed\n` +
      `blocklist in the Sealshot-Release repo, which this Worker cannot commit to:\n\n` +
      `  licensegen revoke --id ${order.licenseId} --blocklist path/license-blocklist.json\n\n` +
      `then commit license-blocklist.json to Sealshot-Release. Until that lands,\n` +
      `the refunded copy keeps working.`,
  });
}

/** Run in the background where possible; await inline when there's no ctx. */
async function runTask(ctx: ExecutionContext | undefined, task: Promise<unknown>): Promise<void> {
  const guarded = task.catch((err) => {
    console.error('[fulfilment] background task failed', err);
  });
  if (ctx?.waitUntil) ctx.waitUntil(guarded);
  else await guarded;
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // The renewal page calls this cross-origin from seal-shot.com, so the
    // browser sends a preflight first. Answer it directly — it carries no
    // body worth parsing and must not reach KV or the rate limiter.
    if (url.pathname === '/renew/verify') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }
      if (request.method === 'POST') {
        return handleVerify(request, env, new Date().toISOString().slice(0, 10));
      }
      return new Response('method not allowed', { status: 405 });
    }

    // The support form posts here natively — no preflight, because a form post
    // is a navigation rather than an XHR, which is also why it works with
    // JavaScript off.
    if (url.pathname === '/feedback') {
      return handleFeedback(request, env);
    }

    if (request.method !== 'POST' || url.pathname !== '/webhooks/polar') {
      return new Response('not found', { status: 404 });
    }
    const rawBody = await request.text();
    if (!(await verifyPolarSignature(rawBody, request.headers, env.POLAR_WEBHOOK_SECRET))) {
      return new Response('bad signature', { status: 401 });
    }

    // Signature is verified above, so this timestamp is authenticated.
    const ts = request.headers.get('webhook-timestamp');
    if (!ts || Math.abs(Date.now() / 1000 - Number(ts)) > MAX_TIMESTAMP_SKEW_SECONDS) {
      return new Response('stale', { status: 400 });
    }

    // Refunds first: a refund arrives as its own event, and until now nothing
    // listened for it — so a refunded order kept its `sent` record, its licence
    // record stayed valid, and the email index still resolved to it.
    const refund = parseOrderRefunded(rawBody);
    if (refund) {
      await runTask(ctx, handleRefund(env, refund.orderId));
      return new Response('ok', { status: 200 });
    }

    const order = parseOrderPaid(rawBody);
    if (!order) return new Response('ignored', { status: 200 }); // unhandled event, or unparsable-but-signed

    const existing = await getOrder(env.ORDERS, order.orderId);

    // Already delivered — don't re-issue or re-email a duplicate delivery.
    if (existing?.state === 'sent') return new Response('ok', { status: 200 });

    // Untrusted buyer name/email: reject control and bidi-override characters
    // (mirrors licensegen's sanitizeOrDie). Unsafe input is a permanent
    // condition, so we return 200 to avoid a Polar retry storm; the stored
    // `rejected` record is the manual-follow-up signal.
    if (hasUnsafeChars(order.name) || hasUnsafeChars(order.email)) {
      await putOrder(env.ORDERS, order.orderId, {
        licenseId: existing?.licenseId ?? '',
        email: order.email,
        name: order.name,
        issued: isoToUTCDay(order.paidAtISO),
        updatesThrough: existing?.updatesThrough ?? '',
        licenseType: existing?.licenseType ?? 'individual',
        seats: existing?.seats ?? 1,
        state: 'rejected',
        attempts: existing?.attempts ?? 0,
        firstSeenAt: existing?.firstSeenAt ?? new Date().toISOString(),
      });
      return new Response('rejected: unsafe input', { status: 200 });
    }

    const purchaseDay = isoToUTCDay(order.paidAtISO);
    const terms = resolveProduct(env, order.productId);

    // An unmapped product still yields a working license — the buyer paid — but
    // it is almost always a misconfiguration, and the most likely one is
    // sandbox product ids surviving into production, where every purchase then
    // quietly resolves to 12 months. Alert on the first sale rather than
    // discovering it at the first renewal.
    if (!isMappedProduct(env, order.productId)) {
      await runTask(ctx, alert(env, {
        subject: `Sealshot: unmapped product on order ${order.orderId}`,
        body:
          `product_id ${order.productId || '(absent)'} is not in PRODUCT_MAP.\n` +
          `Defaulted to a permanent new license. Check PRODUCT_MAP in\n` +
          `wrangler.toml against the live Polar product ids — if this was a\n` +
          `donation, the buyer got a license email they were not promised.`,
      }));
    }

    // A donation is recorded and nothing more. No license id, no address (we
    // have no delivery to justify keeping it), no email — Polar's receipt is
    // the thank-you. Returns before the fulfillment path so the cron never
    // sees it as undelivered.
    if (terms.kind === 'donation') {
      await putOrder(env.ORDERS, order.orderId, {
        licenseId: '',
        email: order.email,
        name: order.name,
        issued: purchaseDay,
        updatesThrough: '',
        licenseType: 'individual',
        seats: 1,
        state: 'donation',
        attempts: 0,
        firstSeenAt: existing?.firstSeenAt ?? new Date().toISOString(),
      });
      return new Response('ok', { status: 200 });
    }

    let licenseId = existing?.licenseId ?? crypto.randomUUID().toUpperCase();
    // Empty = permanent: the license covers every future release. Every gate in
    // the app parses this field as a date and treats an unparseable value as
    // "no limit", so blank is understood by builds that shipped long before
    // permanent updates existed — no app release was needed to grant them.
    let updatesThrough = terms.permanent ? '' : addMonthsUTC(purchaseDay, terms.months as number);
    let name = order.name;
    let addressLines = order.addressLines;
    let licenseType: 'individual' | 'business-volume' = 'individual';
    let seats = 1;

    if (terms.kind === 'renewal') {
      const target = await resolveRenewalTarget(env.ORDERS, {
        referenceId: order.referenceId,
        email: order.email,
      });
      if (target) {
        licenseId = target.licenseId;
        // A renewal must never take terms AWAY. If either side is permanent —
        // the product bought or the license being renewed — the result is
        // permanent; only a dated renewal of a dated license extends a window.
        updatesThrough =
          terms.permanent || target.rec.updatesThrough === ''
            ? ''
            : renewalThrough(target.rec.updatesThrough, purchaseDay, terms.months as number);
        name = target.rec.name;
        // Same rule as the name above: a renewal replaces the file, not the
        // owner, so it must not quietly rewrite who the license says it belongs
        // to. Falls back to this order's address for licenses issued before the
        // field existed, which is how they acquire one.
        addressLines = target.rec.address ?? addressLines;
        licenseType = target.rec.licenseType;
        seats = target.rec.seats;

        if (target.disagreedWithEmail) {
          await runTask(ctx, alert(env, {
            subject: `Sealshot: renewal reference/email disagree on order ${order.orderId}`,
            body:
              `reference_id → ${target.licenseId}\n` +
              `email index  → ${target.disagreedWithEmail}\n\n` +
              `Honored the reference id. Confirm the buyer renewed the right license.`,
          }));
        }

        // Volume licenses are quoted and invoiced by hand; there is no volume
        // product at checkout. Reaching here means someone renewed a multi-seat
        // license through the single-user renewal product, so an organization
        // just extended N seats for the price of one. The renewal is still
        // honored — they paid, and refusing strands them — but it needs a human.
        if (licenseType === 'business-volume') {
          await runTask(ctx, alert(env, {
            subject: `Sealshot: business-volume license renewed at the individual price`,
            body:
              `Order ${order.orderId} renewed license ${licenseId} (${seats} seats)\n` +
              `through the individual renewal product. Volume renewals are meant to\n` +
              `be quoted and invoiced. Honored the renewal; invoice the difference\n` +
              `or agree a correction with the customer.`,
          }));
        }
      } else {
        await runTask(ctx, alert(env, {
          subject: `Sealshot: unmatched renewal on order ${order.orderId}`,
          body:
            `${order.email} bought a renewal but no license matched — neither the\n` +
            `reference id (${order.referenceId ?? 'absent'}) nor the email index.\n\n` +
            `Issued NEW license ${licenseId} on full terms so they are not left\n` +
            `empty-handed. Merge it with their real license by hand.`,
        }));
      }
    }

    const rec: OrderRecord = {
      licenseId,
      email: order.email,
      name,
      // Frozen with the rest of the record: a retry re-issues identical bytes,
      // and an address that changed at Polar between attempts cannot produce two
      // different files for one purchase.
      ...(existing?.address ?? addressLines ? { address: existing?.address ?? addressLines } : {}),
      issued: purchaseDay,
      // Reuse the frozen window on a redelivery. Recomputing it would read a
      // license record an earlier attempt may already have advanced, extending
      // one purchase twice.
      updatesThrough: existing?.updatesThrough || updatesThrough,
      licenseType: existing?.licenseType ?? licenseType,
      seats: existing?.seats ?? seats,
      state: 'pending',
      attempts: existing?.attempts ?? 0,
      firstSeenAt: existing?.firstSeenAt ?? new Date().toISOString(),
      alerted: existing?.alerted,
    };

    // Record the order durably BEFORE acknowledging. This is the boundary that
    // decides who owns the retry: once the record exists, finishing delivery is
    // ours (in the background here, and by the cron if that fails), so we
    // answer 200. If the write itself fails we've kept nothing, so we answer
    // 500 and let Polar redeliver.
    try {
      await putOrder(env.ORDERS, order.orderId, rec);
    } catch (err) {
      console.error('[fulfilment] could not record order, asking Polar to retry', err);
      return new Response('store failed', { status: 500 });
    }

    await runTask(ctx, deliverLicense(env, order.orderId, rec));
    return new Response('ok', { status: 200 });
  },

  /**
   * Cron: retry any order still awaiting delivery. This is what makes the 200
   * above safe — retries are ours, on a schedule we control, rather than
   * depending on Polar's redelivery behavior.
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx?: ExecutionContext): Promise<void> {
    const now = Date.now();
    const pending = await listPending(env.ORDERS);
    const due = pending.filter(({ rec }) => isDue(rec, now));

    if (due.length) {
      console.log(`[fulfilment] retrying ${due.length} of ${pending.length} pending order(s)`);
    }

    await runTask(
      ctx,
      Promise.all(due.map(({ orderId, rec }) => deliverLicense(env, orderId, rec, now)))
    );
  },
};
