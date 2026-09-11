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

/**
 * The site-analytics Worker — download-click counting and the weekly report.
 *
 * A second Worker rather than more surface on license-fulfillment: that one
 * holds the licence signing key and the Polar webhook secret, and this is a
 * public, unauthenticated, high-volume endpoint. Same workers.dev reasoning as
 * above — it stays outside any Access application.
 *
 * ⚠️ Must match `name` in workers/site-analytics/wrangler.toml. A mismatch
 * fails silently in exactly the worst way: sendBeacon ignores the response, so
 * clicks would simply never be counted and the weekly report would show a flat
 * zero that looks like nobody clicked.
 */
export const ANALYTICS_WORKER_ORIGIN = 'https://site-analytics.ray-deng83.workers.dev';

/** Where a download-click beacon posts. See src/components/TrackDownload.astro. */
export const EVENT_URL = `${ANALYTICS_WORKER_ORIGIN}/e`;
