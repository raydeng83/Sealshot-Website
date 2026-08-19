/**
 * The license-fulfillment Worker, as the browser sees it.
 *
 * Kept out of promos.ts because it is infrastructure, not pricing. The Worker
 * allow-lists both seal-shot.com and www.seal-shot.com as request origins, so
 * this works from either host.
 *
 * ⚠️ Still on the workers.dev hostname. That is deliberate for now — it sits
 * outside Cloudflare Access, so the endpoint stays reachable while the site is
 * gated. If it ever moves behind a custom domain, that domain must be excluded
 * from the Access application, or every renewal lookup will get an HTML login
 * page instead of JSON.
 */
export const LICENSE_WORKER_ORIGIN = 'https://license-fulfillment.ray-deng83.workers.dev';

/** Confirms an {email, licenseId} pair before checkout. See src/verify.ts. */
export const VERIFY_URL = `${LICENSE_WORKER_ORIGIN}/renew/verify`;

/**
 * Where the /support form posts. Ours rather than a third party's, and a plain
 * form `action` rather than a fetch: the page then works with JavaScript off,
 * and there is no key to forget to set — which is exactly how the previous
 * arrangement failed, silently, in production.
 */
export const FEEDBACK_URL = `${LICENSE_WORKER_ORIGIN}/feedback`;
