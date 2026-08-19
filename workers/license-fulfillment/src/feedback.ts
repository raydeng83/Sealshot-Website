import { normalizeLine } from './sanitize';

/**
 * The /support form, submitted to us rather than to a third party.
 *
 * It replaces Web3Forms, which was never actually set up: `PUBLIC_WEB3FORMS_KEY`
 * was unset in production, so the live page said "the feedback form isn't wired
 * up in this build" and offered a mailto instead — behind Cloudflare's email
 * obfuscation, which renders as `[email protected]` without JavaScript. The page
 * had no working contact path at all.
 *
 * Deliberately a NATIVE form post, not fetch(): the form carries `action` and
 * `method="post"` and this answers with a 303 back to the page. That keeps the
 * whole path working with JavaScript disabled, which for a privacy-first product
 * is a population that actually exists.
 *
 * Nothing is stored. The message is emailed to support and forgotten — no KV
 * write, so there is no new retention question to answer in the privacy policy.
 * The cost of that choice is that a failed send is a lost message, which is why
 * the failure redirect tells the visitor to email instead rather than pretending
 * it arrived.
 */

/** Where the browser is sent back to. Not caller-supplied: that would be an open redirect. */
const SITE_ORIGIN = 'https://seal-shot.com';

/** Field caps. The message is generous; the rest are single-line values. */
const MAX_MESSAGE = 5000;
const MAX_FIELD = 200;
/** A whole request bigger than this is not a bug report. */
const MAX_BODY_BYTES = 16_000;

const TYPES = ['Bug report', 'Feature request', 'General feedback'];

/**
 * Strict enough to be safe as a `reply_to`: one address, no display name, no
 * newlines. A submitter whose address fails this still gets their message
 * through — it just appears in the body instead, and support replies by hand.
 */
const EMAIL_RE = /^[^\s@,<>"']+@[^\s@,<>"']+\.[^\s@,<>"']+$/;

export type FeedbackEnv = {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  /** Where feedback lands. Falls back to the reply-to inbox, which is support@. */
  FEEDBACK_TO?: string;
  REPLY_TO?: string;
  /** Cloudflare rate-limit binding; absent in tests and local dev. */
  FEEDBACK_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  FETCH?: typeof fetch;
};

function seeOther(path: string): Response {
  return new Response(null, { status: 303, headers: { location: SITE_ORIGIN + path } });
}

function clientKey(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? 'unknown';
}

export async function handleFeedback(request: Request, env: FeedbackEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: { allow: 'POST' } });
  }

  // Rate limit before reading the body, so a flood costs only the check. Degrades
  // OPEN when the binding is absent, matching VERIFY_LIMITER: a misconfiguration
  // must not take the contact form down.
  if (env.FEEDBACK_LIMITER) {
    const { success } = await env.FEEDBACK_LIMITER.limit({ key: clientKey(request) });
    if (!success) return seeOther('/support/?sent=slow');
  }

  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return new Response('too large', { status: 413 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === 'string' ? v : '';
  };

  // Honeypot: a field hidden from people and irresistible to form-fillers. A bot
  // gets the same 303 a human does — telling it that it was caught only invites
  // a second attempt with the field left blank.
  if (str('botcheck').trim()) return seeOther('/support/?sent=1');

  const message = str('message').trim().slice(0, MAX_MESSAGE);
  if (!message) return new Response('message required', { status: 400 });

  const name = normalizeLine(str('name'), MAX_FIELD);
  const emailRaw = normalizeLine(str('email'), MAX_FIELD);
  const email = EMAIL_RE.test(emailRaw) ? emailRaw : '';
  const typeRaw = normalizeLine(str('type'), MAX_FIELD);
  // Only the three the form offers, so the subject line cannot be dictated.
  const type = TYPES.includes(typeRaw) ? typeRaw : 'General feedback';

  const to = env.FEEDBACK_TO ?? env.REPLY_TO ?? 'support@seal-shot.com';
  const body = {
    from: env.EMAIL_FROM,
    to,
    subject: `Sealshot ${type.toLowerCase()}${name ? ` from ${name}` : ''}`,
    // Reply straight to the submitter when the address is usable; otherwise the
    // address (valid or not) is in the body below and support replies by hand.
    ...(email ? { reply_to: email } : {}),
    text:
      `Type:    ${type}\n` +
      `Name:    ${name || '(not given)'}\n` +
      `Email:   ${emailRaw || '(not given)'}${email ? '' : ' (unusable as reply-to)'}\n` +
      `\n${message}\n`,
  };

  const doFetch = env.FETCH ?? fetch;
  try {
    const resp = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      // Keep the provider's explanation: a bare status cost three orders a day
      // of diagnosis once already (see readError in email.ts).
      console.error('[feedback] resend HTTP', resp.status, (await resp.text()).slice(0, 300));
      return seeOther('/support/?sent=0');
    }
  } catch (err) {
    console.error('[feedback] send threw', String(err));
    return seeOther('/support/?sent=0');
  }

  return seeOther('/support/?sent=1');
}
