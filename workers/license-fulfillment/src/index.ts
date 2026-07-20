import { verifyPolarSignature, parseOrderPaid } from './polar';
import { issueLicense, addMonthsUTC } from './license';
import { sendLicenseEmail } from './email';
import { getOrder, putOrder } from './store';
import { base64ToBytes } from './base64';

export interface Env {
  ORDERS: KVNamespace;
  SIGNING_KEY_B64: string;
  POLAR_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  FETCH?: typeof fetch; // test injection only
}

function isoToUTCDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/webhooks/polar') {
      return new Response('not found', { status: 404 });
    }
    const rawBody = await request.text();
    if (!(await verifyPolarSignature(rawBody, request.headers, env.POLAR_WEBHOOK_SECRET))) {
      return new Response('bad signature', { status: 401 });
    }
    const order = parseOrderPaid(rawBody);
    if (!order) return new Response('ignored', { status: 200 }); // non-order.paid or unparsable-but-signed

    const fetchImpl = env.FETCH ?? fetch;
    const priv = base64ToBytes(env.SIGNING_KEY_B64);
    const issued = isoToUTCDay(order.paidAtISO);
    const updatesThrough = addMonthsUTC(issued, 12);
    const fileName = `${order.email}.sealshotlicense`;

    // Idempotency: reuse the stored license id if we've seen this order.
    const existing = await getOrder(env.ORDERS, order.orderId);
    const id = existing?.licenseId ?? crypto.randomUUID().toUpperCase();

    const fileText = await issueLicense(
      { name: order.name, email: order.email, issued, updatesThrough, seats: 1, id }, priv);

    const emailRes = await sendLicenseEmail({
      apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, to: order.email, name: order.name,
      fileName, fileText, fetchImpl,
    });

    await putOrder(env.ORDERS, order.orderId, {
      licenseId: id, email: order.email, issued, state: emailRes.ok ? 'sent' : 'pending',
    });

    if (!emailRes.ok) return new Response('email failed', { status: 500 }); // Polar retries
    return new Response('ok', { status: 200 });
  },
};
