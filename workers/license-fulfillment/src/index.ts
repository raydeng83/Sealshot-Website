import { verifyPolarSignature, parseOrderPaid } from './polar';
import { getOrder, putOrder, listPending, type OrderRecord } from './store';
import { hasUnsafeChars } from './sanitize';
import { deliverLicense, isDue, type FulfillEnv } from './fulfill';
import { handleVerify, corsHeaders, type VerifyEnv } from './verify';
import { resolveProduct, renewalThrough, isMappedProduct } from './product';
import { resolveRenewalTarget } from './renewal';
import { addMonthsUTC } from './license';
import { alert } from './alert';

export interface Env extends FulfillEnv, VerifyEnv {
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

    const order = parseOrderPaid(rawBody);
    if (!order) return new Response('ignored', { status: 200 }); // non-order.paid or unparsable-but-signed

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
          `Defaulted to a 12-month new purchase. If this was a founding or\n` +
          `renewal purchase the customer has the wrong window — check\n` +
          `PRODUCT_MAP in wrangler.toml against the live Polar product ids.`,
      }));
    }

    let licenseId = existing?.licenseId ?? crypto.randomUUID().toUpperCase();
    let updatesThrough = addMonthsUTC(purchaseDay, terms.months);
    let name = order.name;
    let licenseType: 'individual' | 'business-volume' = 'individual';
    let seats = 1;

    if (terms.kind === 'renewal') {
      const target = await resolveRenewalTarget(env.ORDERS, {
        referenceId: order.referenceId,
        email: order.email,
      });
      if (target) {
        licenseId = target.licenseId;
        updatesThrough = renewalThrough(target.rec.updatesThrough, purchaseDay, terms.months);
        name = target.rec.name;
        licenseType = target.rec.licenseType;
        seats = target.rec.seats;

        if (target.disagreedWithEmail) {
          await runTask(ctx, alert(env, {
            subject: `Sealshot: renewal reference/email disagree on order ${order.orderId}`,
            body:
              `reference_id → ${target.licenseId}\n` +
              `email index  → ${target.disagreedWithEmail}\n\n` +
              `Honoured the reference id. Confirm the buyer renewed the right license.`,
          }));
        }

        // Volume licenses are quoted and invoiced by hand; there is no volume
        // product at checkout. Reaching here means someone renewed a multi-seat
        // license through the single-user renewal product, so an organisation
        // just extended N seats for the price of one. The renewal is still
        // honoured — they paid, and refusing strands them — but it needs a human.
        if (licenseType === 'business-volume') {
          await runTask(ctx, alert(env, {
            subject: `Sealshot: business-volume license renewed at the individual price`,
            body:
              `Order ${order.orderId} renewed license ${licenseId} (${seats} seats)\n` +
              `through the individual renewal product. Volume renewals are meant to\n` +
              `be quoted and invoiced. Honoured the renewal; invoice the difference\n` +
              `or agree a correction with the customer.`,
          }));
        }
      } else {
        await runTask(ctx, alert(env, {
          subject: `Sealshot: unmatched renewal on order ${order.orderId}`,
          body:
            `${order.email} bought a renewal but no license matched — neither the\n` +
            `reference id (${order.referenceId ?? 'absent'}) nor the email index.\n\n` +
            `Issued NEW license ${licenseId} with a full window so they are not left\n` +
            `empty-handed. Merge it with their real license by hand.`,
        }));
      }
    }

    const rec: OrderRecord = {
      licenseId,
      email: order.email,
      name,
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
   * depending on Polar's redelivery behaviour.
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
