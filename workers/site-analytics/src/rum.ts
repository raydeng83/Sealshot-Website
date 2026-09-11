/**
 * Traffic, read back out of Cloudflare Web Analytics.
 *
 * Web Analytics is the collection side of this system and it needs no code at
 * all: Pages → Metrics → Web Analytics injects the beacon at deploy time. This
 * file is only the read path — the GraphQL Analytics API, dataset
 * `rumPageloadEventsAdaptiveGroups`.
 *
 * What the dataset can and cannot answer decides what the report may say.
 * Cloudflare's own definitions:
 *
 *   page view — "a successful HTTP response with a content-type of HTML"
 *   visit     — "a page view that originated from a different website or
 *                direct link" (the referer does not match the hostname)
 *
 * There is NO unique-visitor metric. Web Analytics is cookieless and stores no
 * visitor identifier, so uniqueness is not merely unexposed, it is not
 * measured. The report therefore says "Visits" and never "Visitors".
 */

export type Totals = { pageViews: number; visits: number };

export type Traffic = {
  current: Totals;
  previous: Totals;
  /** Current week only, keyed `YYYY-MM-DD`. Days with no traffic are absent. */
  byDay: Map<string, Totals>;
};

export type TopPages = {
  paths: Array<{ path: string; views: number }>;
  /** Page views of `/` — the denominator for the homepage click rate. */
  homeViews: number;
};

export type RumEnv = {
  CF_ACCOUNT_ID?: string;
  CF_RUM_SITE_TAG?: string;
  CF_API_TOKEN?: string;
  SITE_HOSTS?: string;
  FETCH?: typeof fetch; // test injection only
};

const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

/**
 * Both ids are 32 hex characters. Checked because they are interpolated into
 * the query document rather than passed as GraphQL variables: the datetime
 * filters are a `Time` scalar whose exact type name differs between datasets,
 * and getting it wrong fails the whole query — inlining sidesteps that, and
 * this validation is what keeps inlining safe.
 */
const HEX32 = /^[0-9a-f]{32}$/i;

export function hostsOf(env: RumEnv): string[] {
  return (env.SITE_HOSTS ?? 'seal-shot.com,www.seal-shot.com')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
}

/** Throws with a message a human can act on — it lands in the failure email. */
function requireConfig(env: RumEnv): { account: string; site: string; token: string } {
  const account = env.CF_ACCOUNT_ID ?? '';
  const site = env.CF_RUM_SITE_TAG ?? '';
  const token = env.CF_API_TOKEN ?? '';
  if (!HEX32.test(account)) {
    throw new Error('CF_ACCOUNT_ID is not set to a 32-hex account id (wrangler.toml [vars])');
  }
  if (!HEX32.test(site)) {
    throw new Error(
      'CF_RUM_SITE_TAG is not set to a 32-hex site tag. Take the site TAG from ' +
        'the Web Analytics dashboard — not the site token in the beacon\'s ' +
        'data-cf-beacon attribute, which is a different 32-hex value.'
    );
  }
  if (!token) throw new Error('CF_API_TOKEN secret is not set (wrangler secret put CF_API_TOKEN)');
  return { account, site, token };
}

type GraphQLRow = {
  count?: number;
  sum?: { visits?: number } | null;
  dimensions?: { date?: string; requestHost?: string; requestPath?: string };
};

async function query(env: RumEnv, document: string): Promise<GraphQLRow[]> {
  const { token } = requireConfig(env);
  const doFetch = env.FETCH ?? fetch;
  const resp = await doFetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: document }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`GraphQL HTTP ${resp.status}: ${text.slice(0, 300)}`);

  let body: {
    data?: { viewer?: { accounts?: Array<{ rows?: GraphQLRow[] }> } };
    errors?: Array<{ message?: string }>;
  };
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`GraphQL returned non-JSON: ${text.slice(0, 300)}`);
  }

  // A 200 with an `errors` array is the normal GraphQL failure shape, and it is
  // how an unavailable dimension reports itself — so this must not be treated
  // as an empty result. An empty result is a quiet week; this is a broken query.
  if (body.errors?.length) {
    throw new Error(`GraphQL: ${body.errors.map((e) => e.message ?? '?').join('; ')}`);
  }

  return body.data?.viewer?.accounts?.[0]?.rows ?? [];
}

function filterClause(site: string, from: string, to: string): string {
  return `siteTag: "${site}", datetime_geq: "${from}", datetime_leq: "${to}"`;
}

/**
 * Fourteen days in one request, split into two weeks here.
 *
 * That split IS the week-over-week mechanism: nothing is stored between runs,
 * so there is no snapshot to drift, no first-run special case, and re-running
 * the report by hand produces the same comparison the cron would have.
 */
export async function fetchTraffic(
  env: RumEnv,
  current: { start: string; end: string },
  previous: { start: string; end: string }
): Promise<Traffic> {
  const { account, site } = requireConfig(env);
  const rows = await query(
    env,
    `{ viewer { accounts(filter: { accountTag: "${account}" }) {
        rows: rumPageloadEventsAdaptiveGroups(
          limit: 5000
          filter: { ${filterClause(site, `${previous.start}T00:00:00Z`, `${current.end}T23:59:59Z`)} }
        ) { count sum { visits } dimensions { date requestHost } }
    } } }`
  );

  const hosts = hostsOf(env);
  const zero = (): Totals => ({ pageViews: 0, visits: 0 });
  const traffic: Traffic = { current: zero(), previous: zero(), byDay: new Map() };

  for (const row of rows) {
    const day = row.dimensions?.date;
    const host = row.dimensions?.requestHost;
    // One site tag can cover several hostnames, and Pages injects the beacon
    // into PREVIEW deployments too — so *.pages.dev rows are real and would
    // quietly inflate the report with our own testing.
    if (!day || !host || !hosts.includes(host)) continue;

    const add = { pageViews: row.count ?? 0, visits: row.sum?.visits ?? 0 };
    const bucket =
      day >= current.start && day <= current.end
        ? traffic.current
        : day >= previous.start && day <= previous.end
          ? traffic.previous
          : null;
    if (!bucket) continue;

    bucket.pageViews += add.pageViews;
    bucket.visits += add.visits;

    if (bucket === traffic.current) {
      const at = traffic.byDay.get(day) ?? zero();
      at.pageViews += add.pageViews;
      at.visits += add.visits;
      traffic.byDay.set(day, at);
    }
  }

  return traffic;
}

/**
 * Top pages, as its own request so that losing it costs only itself.
 *
 * `requestPath` is the one dimension in this report not confirmed against the
 * live API (`requestHost` and `date` are). If it turns out to be unavailable
 * the query 200s with an `errors` array, which `query` throws on — the caller
 * catches, and the report prints "top pages unavailable" instead of dropping
 * the traffic numbers that had already succeeded.
 */
export async function fetchTopPages(
  env: RumEnv,
  week: { start: string; end: string },
  limit = 10
): Promise<TopPages> {
  const { account, site } = requireConfig(env);
  const rows = await query(
    env,
    `{ viewer { accounts(filter: { accountTag: "${account}" }) {
        rows: rumPageloadEventsAdaptiveGroups(
          limit: 500
          orderBy: [count_DESC]
          filter: { ${filterClause(site, `${week.start}T00:00:00Z`, `${week.end}T23:59:59Z`)} }
        ) { count dimensions { requestPath requestHost } }
    } } }`
  );

  const hosts = hostsOf(env);
  const byPath = new Map<string, number>();
  for (const row of rows) {
    const path = row.dimensions?.requestPath;
    const host = row.dimensions?.requestHost;
    if (!path || !host || !hosts.includes(host)) continue;
    // apex and www are the same page; the 301 makes them one in practice, but
    // summing rather than listing twice costs nothing and cannot be wrong.
    byPath.set(path, (byPath.get(path) ?? 0) + (row.count ?? 0));
  }

  const paths = [...byPath.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));

  return { paths: paths.slice(0, limit), homeViews: byPath.get('/') ?? 0 };
}
