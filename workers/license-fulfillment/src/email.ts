import { bytesToBase64, utf8ToBytes } from './base64';

/**
 * Cap on the provider explanation kept from a failed send. It travels into
 * `lastError` on the KV order record and from there into alert emails, so it
 * is bounded — a provider answering with an HTML error page would otherwise
 * bloat every retry's write.
 */
const MAX_ERROR_CHARS = 300;

/**
 * Resend explains a refusal in the response body, and that explanation is
 * usually the whole diagnosis: a 403 reads "You can only send testing emails
 * to your own email address (…)", naming both the cause and the fix.
 *
 * Discarding it is expensive. On 2026-08-10 three orders sat undelivered
 * behind a bare `email HTTP 403` while the reason sat unread in the body.
 */
async function readError(resp: Response): Promise<string | undefined> {
  try {
    const text = (await resp.text()).trim();
    if (!text) return undefined;
    return text.length > MAX_ERROR_CHARS ? `${text.slice(0, MAX_ERROR_CHARS)}…` : text;
  } catch {
    // An unreadable body must never mask the failure it describes — the
    // status is the part callers actually branch on.
    return undefined;
  }
}

export async function sendLicenseEmail(args: {
  apiKey: string; from: string; to: string; name: string;
  fileName: string; fileText: string; replyTo?: string; fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const doFetch = args.fetchImpl ?? fetch;
  const body = {
    from: args.from,
    to: args.to,
    // The From subdomain is send-only (its MX routes bounces to Resend, not to
    // an inbox), so without this a buyer's reply would bounce.
    ...(args.replyTo ? { reply_to: args.replyTo } : {}),
    subject: 'Your Sealshot license',
    text:
      `Hi ${args.name || 'there'},\n\n` +
      `Thanks for buying Sealshot. Your license is attached as ${args.fileName}.\n\n` +
      `To activate: open Sealshot, go to Settings ▸ License, then open the attached ` +
      `file or drag it onto the window.\n\n` +
      `Keep this file — it is your proof of purchase.\n\n— Sealshot`,
    attachments: [{ filename: args.fileName, content: bytesToBase64(utf8ToBytes(args.fileText)) }],
  };
  const resp = await doFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (resp.ok) return { ok: true, status: resp.status };
  return { ok: false, status: resp.status, error: await readError(resp) };
}
