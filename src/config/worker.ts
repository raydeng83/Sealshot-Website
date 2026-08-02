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
