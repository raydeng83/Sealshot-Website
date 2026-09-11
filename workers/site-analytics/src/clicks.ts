/**
 * Download clicks, read back out of Workers Analytics Engine.
 *
 * Counted with SUM(_sample_interval) rather than COUNT(). Analytics Engine
 * downsamples per index at high volume, and a row then stands for however many
 * rows `_sample_interval` says — so COUNT() is right today at our volume and
 * silently wrong later, which is the worst possible failure for a number
 * nobody re-derives by hand.
 */
import { LABELS, DOWNLOAD_CLICK, type Label } from './event';

/**
 * Must match `dataset` on the [[analytics_engine_datasets]] binding in
 * wrangler.toml. The binding name (SITE_EVENTS) is the write side; this is the
 * table name the SQL API reads, and they are not the same string.
 */
const DATASET = 'sealshot_site_events';

const SQL_URL = (account: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`;

export type Clicks = {
  current: Record<Label, number>;
  previous: Record<Label, number>;
  /**
   * True when the dataset does not exist yet — no click has ever been
   * recorded. Distinct from "zero clicks this week", which is a real
   * measurement; this one means the measurement has not started.
   */
  notYetCollecting: boolean;
};

export type ClicksEnv = {
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  FETCH?: typeof fetch; // test injection only
};

function emptyTally(): Record<Label, number> {
  return Object.fromEntries(LABELS.map((l) => [l, 0])) as Record<Label, number>;
}

/**
 * Analytics Engine creates a dataset lazily, on the first write. Until someone
 * clicks Download for the first time there is no table to select from, and the
 * API says so. That is the expected state of the very first report, so it must
 * not fail the whole email.
 */
function isMissingDataset(message: string): boolean {
  return /unknown table|doesn't exist|does not exist|not found/i.test(message);
}

export async function fetchClicks(
  env: ClicksEnv,
  current: { startUnix: number; endUnixExclusive: number },
  previous: { startUnix: number; endUnixExclusive: number },
  dayOfUnix: (day: string) => 'current' | 'previous' | null
): Promise<Clicks> {
  const account = env.CF_ACCOUNT_ID ?? '';
  const token = env.CF_API_TOKEN ?? '';
  if (!account) throw new Error('CF_ACCOUNT_ID is not set (wrangler.toml [vars])');
  if (!token) throw new Error('CF_API_TOKEN secret is not set (wrangler secret put CF_API_TOKEN)');

  // GROUP BY takes the ALIASES, not the expressions they stand for. Analytics
  // Engine rejects an expression here outright:
  //
  //   HTTP 422 — Input was invalid: in the GROUP BY clause you may only
  //   provide column names: formatDateTime(toStartOfDay("timestamp"), …)
  //
  // This contradicts Cloudflare's SQL reference, which says a GROUP BY
  // `<expression>` "can just be a column name but it is also possible to
  // supply a complex expression here". The docs are wrong. All four forms were
  // run against the live API on 2026-09-09: expressions 422, aliases 200,
  // aliases over a raw column 200, and ORDER BY over an alias 200.
  //
  // Ordering is still done in TypeScript — there is no clause to get wrong.
  const day = `formatDateTime(toStartOfDay(timestamp), '%Y-%m-%d')`;
  const sql =
    `SELECT blob2 AS label, ${day} AS day, SUM(_sample_interval) AS clicks ` +
    `FROM ${DATASET} ` +
    `WHERE blob1 = '${DOWNLOAD_CLICK}' ` +
    `AND timestamp >= toDateTime(${previous.startUnix}) ` +
    `AND timestamp < toDateTime(${current.endUnixExclusive}) ` +
    `GROUP BY label, day`;

  const doFetch = env.FETCH ?? fetch;
  const resp = await doFetch(SQL_URL(account), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: sql,
  });

  const text = await resp.text();
  if (!resp.ok) {
    if (isMissingDataset(text)) {
      return { current: emptyTally(), previous: emptyTally(), notYetCollecting: true };
    }
    throw new Error(`Analytics Engine HTTP ${resp.status}: ${text.slice(0, 300)}`);
  }

  let body: { data?: Array<{ label?: string; day?: string; clicks?: number | string }> };
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Analytics Engine returned non-JSON: ${text.slice(0, 300)}`);
  }

  const clicks: Clicks = {
    current: emptyTally(),
    previous: emptyTally(),
    notYetCollecting: false,
  };

  for (const row of body.data ?? []) {
    const label = row.label;
    if (!label || !LABELS.includes(label as Label)) continue;
    if (!row.day) continue;
    const week = dayOfUnix(row.day);
    if (!week) continue;
    // ClickHouse renders 64-bit integers as JSON strings, so this is a string
    // in production and a number in tests. Number() covers both.
    clicks[week][label as Label] += Number(row.clicks ?? 0);
  }

  return clicks;
}
