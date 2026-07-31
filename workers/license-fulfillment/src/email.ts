import { bytesToBase64, utf8ToBytes } from './base64';

export async function sendLicenseEmail(args: {
  apiKey: string; from: string; to: string; name: string;
  fileName: string; fileText: string; replyTo?: string; fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; status: number }> {
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
  return { ok: resp.ok, status: resp.status };
}
