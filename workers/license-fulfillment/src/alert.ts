/**
 * Operational alerts about fulfilment problems.
 *
 * Always logs — `console.error` reaches `wrangler tail` and Workers Logs, and
 * Cloudflare notifications can be set to fire on Worker errors, so the log is
 * the alerting floor with no configuration at all.
 *
 * Additionally emails ALERT_EMAIL when it's set. That send goes through the
 * same provider as licence delivery, so a total Resend outage would silence
 * the email too — the log is what covers that case.
 */
export type AlertEnv = {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  ALERT_EMAIL?: string;
  FETCH?: typeof fetch;
};

export async function alert(env: AlertEnv, msg: { subject: string; body: string }): Promise<void> {
  console.error(`[fulfilment-alert] ${msg.subject}\n${msg.body}`);

  if (!env.ALERT_EMAIL) return;

  try {
    const doFetch = env.FETCH ?? fetch;
    await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: env.ALERT_EMAIL,
        subject: msg.subject,
        text: msg.body,
      }),
    });
  } catch (err) {
    // An alert that fails must never break fulfilment — the log above stands.
    console.error('[fulfilment-alert] alert email failed', err);
  }
}
