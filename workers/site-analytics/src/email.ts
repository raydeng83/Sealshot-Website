/**
 * Sending the report.
 *
 * Resend, not a Cloudflare-native mailer: Cloudflare Email Routing is INBOUND
 * only, and Email Workers can send only to addresses verified as routing
 * destinations. Resend is already the site's transactional provider, with
 * mail.seal-shot.com verified since 2026-08-10 — so this reuses a sending
 * identity that is known to work rather than introducing a second one to keep
 * verified.
 *
 * Mirrors workers/license-fulfillment/src/email.ts, minus attachments. The
 * provider's explanation of a refusal is kept for the same reason it is there:
 * a 403 body names both the cause and the fix, and three orders were lost on
 * 2026-08-10 behind a bare "HTTP 403" while the reason sat unread.
 */

const MAX_ERROR_CHARS = 300;

async function readError(resp: Response): Promise<string | undefined> {
  try {
    const text = (await resp.text()).trim();
    if (!text) return undefined;
    return text.length > MAX_ERROR_CHARS ? `${text.slice(0, MAX_ERROR_CHARS)}…` : text;
  } catch {
    return undefined;
  }
}

/** Both recipients on one message, so a reply keeps them together. */
export function recipients(reportTo: string | undefined): string[] {
  return (reportTo ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
}

export async function sendReport(args: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const doFetch = args.fetchImpl ?? fetch;
  const resp = await doFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
    }),
  });
  if (resp.ok) return { ok: true, status: resp.status };
  return { ok: false, status: resp.status, error: await readError(resp) };
}
