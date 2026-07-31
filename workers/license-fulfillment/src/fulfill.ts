import { issueLicense, addMonthsUTC } from './license';
import { sendLicenseEmail } from './email';
import { putOrder, type OrderRecord } from './store';
import { base64ToBytes } from './base64';
import { alert } from './alert';

/** Everything fulfilment needs from the environment. */
export type FulfillEnv = {
  ORDERS: KVNamespace;
  SIGNING_KEY_B64: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  REPLY_TO?: string;
  ALERT_EMAIL?: string;
  FETCH?: typeof fetch;
};

/** Alert once an order has gone undelivered this long. */
export const ALERT_AFTER_MINUTES = 30;
/** Stop retrying after this long and mark the order failed. */
export const GIVE_UP_AFTER_HOURS = 48;

/**
 * Minutes to wait before attempt N+1. Doubles from 5 minutes, capped at 4
 * hours — bounded so a stuck order can't burn the KV write budget (each
 * attempt costs one write, and the free tier allows 1,000/day).
 */
export function nextDelayMinutes(attempts: number): number {
  return Math.min(5 * 2 ** Math.max(0, attempts - 1), 240);
}

const minutesSince = (iso: string, now: number) => (now - Date.parse(iso)) / 60_000;

/** True when this pending order is due for another delivery attempt. */
export function isDue(rec: OrderRecord, now: number): boolean {
  if (!rec.lastAttemptAt) return true;
  return minutesSince(rec.lastAttemptAt, now) >= nextDelayMinutes(rec.attempts);
}

/**
 * Issue (or re-issue) the licence for a recorded order and email it.
 *
 * The licence is regenerated from the stored record rather than passed in, so
 * the webhook path and the cron retry path produce byte-identical files for
 * the same order — the licence id is what makes that stable.
 *
 * Updates the record to `sent` on success, or back to `pending` (with the
 * attempt counted) on failure. Never throws: callers run it in the
 * background, where a rejection would be invisible.
 */
export async function deliverLicense(
  env: FulfillEnv,
  orderId: string,
  rec: OrderRecord,
  now = Date.now()
): Promise<boolean> {
  const attempts = rec.attempts + 1;
  const attemptedAt = new Date(now).toISOString();

  try {
    const fileText = await issueLicense(
      {
        name: rec.name,
        email: rec.email,
        issued: rec.issued,
        updatesThrough: addMonthsUTC(rec.issued, 12),
        seats: 1,
        id: rec.licenseId,
      },
      base64ToBytes(env.SIGNING_KEY_B64)
    );

    const res = await sendLicenseEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      replyTo: env.REPLY_TO,
      to: rec.email,
      name: rec.name,
      fileName: `${rec.email}.sealshotlicense`,
      fileText,
      fetchImpl: env.FETCH ?? fetch,
    });

    if (res.ok) {
      await putOrder(env.ORDERS, orderId, {
        ...rec,
        state: 'sent',
        attempts,
        lastAttemptAt: attemptedAt,
        lastError: undefined,
      });
      return true;
    }

    await recordFailure(env, orderId, rec, attempts, attemptedAt, `email HTTP ${res.status}`, now);
    return false;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await recordFailure(env, orderId, rec, attempts, attemptedAt, reason, now);
    return false;
  }
}

async function recordFailure(
  env: FulfillEnv,
  orderId: string,
  rec: OrderRecord,
  attempts: number,
  attemptedAt: string,
  reason: string,
  now: number
): Promise<void> {
  const ageHours = minutesSince(rec.firstSeenAt, now) / 60;
  const givingUp = ageHours >= GIVE_UP_AFTER_HOURS;
  // Alert once when the order has been stuck past the threshold — and always
  // when giving up, since that one needs manual fulfilment.
  const shouldAlert =
    givingUp || (!rec.alerted && minutesSince(rec.firstSeenAt, now) >= ALERT_AFTER_MINUTES);

  await putOrder(env.ORDERS, orderId, {
    ...rec,
    state: givingUp ? 'failed' : 'pending',
    attempts,
    lastAttemptAt: attemptedAt,
    lastError: reason,
    alerted: rec.alerted || shouldAlert,
  });

  if (shouldAlert) {
    await alert(env, {
      subject: givingUp
        ? `Sealshot: GAVE UP delivering order ${orderId}`
        : `Sealshot: order ${orderId} undelivered for ${Math.round(minutesSince(rec.firstSeenAt, now))} min`,
      body:
        `Order:     ${orderId}\n` +
        `Buyer:     ${rec.email}\n` +
        `License:   ${rec.licenseId}\n` +
        `Attempts:  ${attempts}\n` +
        `Last error: ${reason}\n\n` +
        (givingUp
          ? 'No further retries. This licence must be delivered manually.'
          : 'Retries continue automatically.'),
    });
  }
}
