import { verifyPolarSignature, parseOrderPaid } from './polar';
import { getOrder, putOrder, listPending, type OrderRecord } from './store';
import { hasUnsafeChars } from './sanitize';
import { deliverLicense, isDue, type FulfillEnv } from './fulfill';
import { handleVerify, corsHeaders, type VerifyEnv } from './verify';

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
        state: 'rejected',
        attempts: existing?.attempts ?? 0,
        firstSeenAt: existing?.firstSeenAt ?? new Date().toISOString(),
      });
      return new Response('rejected: unsafe input', { status: 200 });
    }

    const rec: OrderRecord = {
      licenseId: existing?.licenseId ?? crypto.randomUUID().toUpperCase(),
      email: order.email,
      name: order.name,
      issued: isoToUTCDay(order.paidAtISO),
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
