/**
 * The download-click counter: `POST /e`.
 *
 * One data point per click, and nothing else. No cookie, no identifier, no
 * user agent, no IP — the whole record is the event name, a label, and the
 * timestamp Analytics Engine adds. There is deliberately nothing here that
 * could distinguish two visitors from one visitor twice, which is also why the
 * report can never claim "unique visitors".
 *
 * The site calls this with `navigator.sendBeacon`, so the response is never
 * read: the browser queues the POST and the click navigates on immediately.
 * That is the reason for the `text/plain` body — see the site component.
 */

/**
 * The homepage "Download for Mac" button does NOT link to a download: it links
 * to /download/. The real .dmg click is a second button on that page, whose
 * href is rewritten at runtime from the GitHub releases API. Those are two
 * different things and collapsing them into one number would answer neither
 * question, so each carries its own label:
 *
 *   home — homepage button. Download INTENT.
 *   dmg  — the .dmg link on /download/. A download actually starting.
 *
 * An unknown label is rejected rather than recorded, so a typo in the markup
 * shows up as a missing metric rather than as a silent third category nobody
 * reads.
 */
export const LABELS = ['home', 'dmg'] as const;
export type Label = (typeof LABELS)[number];

/** blob1 on every data point. Reserved so a second event type can share the dataset. */
export const DOWNLOAD_CLICK = 'download_click';

/** Bodies are ~40 bytes. Anything approaching this is not our beacon. */
const MAX_BODY_BYTES = 512;

export type EventEnv = {
  /** Absent in tests and in `wrangler dev` without a dataset; the endpoint then no-ops. */
  SITE_EVENTS?: AnalyticsEngineDataset;
  /** Cloudflare rate-limit binding; absent in tests and local dev. */
  EVENT_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  /** Comma-separated hostnames, from wrangler.toml. */
  SITE_HOSTS?: string;
};

function allowedOrigins(env: EventEnv): string[] {
  const hosts = (env.SITE_HOSTS ?? 'seal-shot.com,www.seal-shot.com')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  return hosts.map((h) => `https://${h}`);
}

/**
 * Origin is checked, but it is a speed bump and not a gate: any non-browser
 * client can send whatever Origin it likes. What it genuinely stops is another
 * site's page firing events at us, and casual noise. Inflating this counter
 * from a script remains possible by design — it is a marketing figure, not an
 * audited one, and treating it as tamper-proof would be the real mistake.
 *
 * Localhost is allowed for the same reason it is cheap: it makes `npm run dev`
 * against `wrangler dev` a real test of this path rather than a mock of it,
 * and it concedes nothing that spoofing did not already concede.
 */
export function isAllowedOrigin(env: EventEnv, origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins(env).includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

/** `{ event, label }` if the body is one of ours, otherwise null. */
export function parseEvent(body: string): { label: Label } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { event, label } = parsed as { event?: unknown; label?: unknown };
  if (event !== DOWNLOAD_CLICK) return null;
  if (typeof label !== 'string' || !LABELS.includes(label as Label)) return null;
  return { label: label as Label };
}

export async function handleEvent(request: Request, env: EventEnv): Promise<Response> {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });

  if (!isAllowedOrigin(env, request.headers.get('origin'))) {
    return new Response('forbidden', { status: 403 });
  }

  // The IP derives the limiter key and goes no further: it is not written to
  // the data point, not logged, and not stored. Degrades OPEN when the binding
  // is absent, matching license-fulfillment — a misconfigured limiter must not
  // start silently dropping events.
  if (env.EVENT_LIMITER) {
    const key = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const { success } = await env.EVENT_LIMITER.limit({ key });
    if (!success) return new Response('rate limited', { status: 429 });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return new Response('too large', { status: 413 });

  const parsed = parseEvent(body);
  if (!parsed) return new Response('bad event', { status: 400 });

  // Absent binding is not an error worth failing a beacon over — the click
  // already happened and the visitor is already gone.
  env.SITE_EVENTS?.writeDataPoint({
    blobs: [DOWNLOAD_CLICK, parsed.label],
    doubles: [1],
    // Sampling, if Cloudflare ever applies it, is per-index. One index for the
    // whole event type keeps the two labels sampled together, so the ratio
    // between them stays meaningful.
    indexes: [DOWNLOAD_CLICK],
  });

  // 204: sendBeacon discards the body, and there is nothing to say.
  return new Response(null, { status: 204 });
}
