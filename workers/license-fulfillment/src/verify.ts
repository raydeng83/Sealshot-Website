import { getLicense, findLicenseIdByEmail } from './store';
import { renewalThrough } from './product';

/**
 * Both hosts are ours. The site canonicalises on the apex and `www` 301s to
 * it, so in practice the page origin is the apex — but allow-listing only one
 * makes a redirect-rule change break the typed email + license-id path while
 * the file-drop path keeps working, which is the hardest kind of failure to
 * notice. Allowing both costs nothing.
 */
const ALLOWED_ORIGINS = ['https://seal-shot.com', 'https://www.seal-shot.com'];

/** Renewals are always 12 months; the founding term applies to first purchases only. */
const RENEWAL_MONTHS = 12;

export type VerifyEnv = {
  ORDERS: KVNamespace;
  /** Cloudflare rate-limit binding; absent in tests and local dev. */
  VERIFY_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
};

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  return {
    // Echo only a known origin. An unrecognized one gets the apex, which the
    // browser then refuses — a wrong origin must not be granted access.
    'access-control-allow-origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    // The allowed origin varies by request, so caches must not share responses.
    vary: 'Origin',
  };
}

function json(request: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(request) },
  });
}

/** Caller IP, or a constant when Cloudflare didn't supply one. */
function clientKey(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? 'unknown';
}

/**
 * Confirms an email + license-id PAIR before checkout, so the renewal page can
 * show the customer what they are about to buy instead of asking them to
 * eyeball a UUID.
 *
 * A pair is not a customer-enumeration oracle: the caller must already hold
 * the license id, and holding it means holding the license file. Email-only
 * lookup is deliberately not offered — that WOULD be an oracle, answering
 * "does this person own Sealshot?" for any address.
 *
 * Unknown id and mismatched pair return an identical body, so a wrong pair is
 * indistinguishable from an id that doesn't exist.
 */
export async function handleVerify(
  request: Request,
  env: VerifyEnv,
  today: string
): Promise<Response> {
  // Rate limit before parsing, so a flood costs us nothing but the check.
  if (env.VERIFY_LIMITER) {
    const { success } = await env.VERIFY_LIMITER.limit({ key: clientKey(request) });
    if (!success) return json(request, { error: 'rate_limited' }, 429);
  }

  let body: { email?: unknown; licenseId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json(request, { error: 'bad_request' }, 400);
  }
  const email = typeof body.email === 'string' ? body.email : '';
  const licenseId = typeof body.licenseId === 'string' ? body.licenseId : '';
  if (!email || !licenseId) return json(request, { error: 'bad_request' }, 400);

  // Both lookups always, and in parallel: short-circuiting on a missing
  // license would make "unknown id" measurably faster than "wrong pair",
  // reintroducing through timing the distinction the identical 404 hides.
  const [rec, indexed] = await Promise.all([
    getLicense(env.ORDERS, licenseId),
    findLicenseIdByEmail(env.ORDERS, email),
  ]);
  if (!rec || indexed !== licenseId) return json(request, { error: 'not_found' }, 404);

  return json(
    request,
    {
      name: rec.name,
      email: rec.email,
      licenseType: rec.licenseType,
      updatesThrough: rec.updatesThrough,
      projectedThrough: renewalThrough(rec.updatesThrough, today, RENEWAL_MONTHS),
      seats: rec.seats,
    },
    200
  );
}
