import { describe, it, expect, vi } from 'vitest';
import { fetchTraffic, fetchTopPages } from '../src/rum';

const ENV = {
  CF_ACCOUNT_ID: 'a'.repeat(32),
  CF_RUM_SITE_TAG: 'b'.repeat(32),
  CF_API_TOKEN: 'tok',
  SITE_HOSTS: 'seal-shot.com,www.seal-shot.com',
};

const CURRENT = { start: '2026-09-07', end: '2026-09-13' };
const PREVIOUS = { start: '2026-08-31', end: '2026-09-06' };

function reply(rows: unknown[]) {
  return vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify({ data: { viewer: { accounts: [{ rows }] } } }), { status: 200 })
  );
}

describe('fetchTraffic', () => {
  it('splits one 14-day response into the two weeks', async () => {
    // The split IS the week-over-week mechanism: nothing is stored between
    // runs, so there is no snapshot to drift and no first-run special case.
    const FETCH = reply([
      { count: 100, sum: { visits: 40 }, dimensions: { date: '2026-09-07', requestHost: 'seal-shot.com' } },
      { count: 50, sum: { visits: 20 }, dimensions: { date: '2026-09-13', requestHost: 'seal-shot.com' } },
      { count: 70, sum: { visits: 30 }, dimensions: { date: '2026-09-01', requestHost: 'seal-shot.com' } },
    ]);
    const t = await fetchTraffic({ ...ENV, FETCH }, CURRENT, PREVIOUS);
    expect(t.current).toEqual({ pageViews: 150, visits: 60 });
    expect(t.previous).toEqual({ pageViews: 70, visits: 30 });
    expect(t.byDay.get('2026-09-07')).toEqual({ pageViews: 100, visits: 40 });
    expect(t.byDay.has('2026-09-01')).toBe(false); // previous week is not in byDay
  });

  it('drops preview-deployment traffic', async () => {
    // Pages injects the beacon into PREVIEW deployments too, so *.pages.dev
    // rows are real and would inflate the report with our own testing.
    const FETCH = reply([
      { count: 100, sum: { visits: 40 }, dimensions: { date: '2026-09-07', requestHost: 'seal-shot.com' } },
      { count: 999, sum: { visits: 500 }, dimensions: { date: '2026-09-07', requestHost: 'sealshot-website.pages.dev' } },
    ]);
    const t = await fetchTraffic({ ...ENV, FETCH }, CURRENT, PREVIOUS);
    expect(t.current).toEqual({ pageViews: 100, visits: 40 });
  });

  it('sums apex and www into one figure', async () => {
    const FETCH = reply([
      { count: 100, sum: { visits: 40 }, dimensions: { date: '2026-09-07', requestHost: 'seal-shot.com' } },
      { count: 10, sum: { visits: 4 }, dimensions: { date: '2026-09-07', requestHost: 'www.seal-shot.com' } },
    ]);
    const t = await fetchTraffic({ ...ENV, FETCH }, CURRENT, PREVIOUS);
    expect(t.current).toEqual({ pageViews: 110, visits: 44 });
  });

  it('treats a 200 carrying GraphQL errors as a failure, not a quiet week', async () => {
    // This is how an unavailable dimension reports itself. Reading it as zero
    // would email "0 visits" during an outage.
    const FETCH = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ errors: [{ message: 'unknown field requestPath' }] }), { status: 200 })
    );
    await expect(fetchTraffic({ ...ENV, FETCH }, CURRENT, PREVIOUS)).rejects.toThrow(/requestPath/);
  });

  it('names the missing setting rather than failing obscurely', async () => {
    await expect(
      fetchTraffic({ ...ENV, CF_RUM_SITE_TAG: '', FETCH: reply([]) }, CURRENT, PREVIOUS)
    ).rejects.toThrow(/CF_RUM_SITE_TAG/);
    await expect(
      fetchTraffic({ ...ENV, CF_API_TOKEN: '', FETCH: reply([]) }, CURRENT, PREVIOUS)
    ).rejects.toThrow(/CF_API_TOKEN/);
  });

  it('sends the token as a bearer and the window in the document', async () => {
    const FETCH = reply([]);
    await fetchTraffic({ ...ENV, FETCH }, CURRENT, PREVIOUS);
    const [, init] = FETCH.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok');
    const sent = JSON.parse((init as RequestInit).body as string).query as string;
    expect(sent).toContain('2026-08-31T00:00:00Z');
    expect(sent).toContain('2026-09-13T23:59:59Z');
  });
});

describe('fetchTopPages', () => {
  it('ranks paths and picks out the homepage denominator', async () => {
    const FETCH = reply([
      { count: 1020, dimensions: { requestPath: '/', requestHost: 'seal-shot.com' } },
      { count: 386, dimensions: { requestPath: '/guides/', requestHost: 'seal-shot.com' } },
      { count: 500, dimensions: { requestPath: '/', requestHost: 'evil.example' } },
    ]);
    const top = await fetchTopPages({ ...ENV, FETCH }, CURRENT);
    expect(top.paths).toEqual([
      { path: '/', views: 1020 },
      { path: '/guides/', views: 386 },
    ]);
    expect(top.homeViews).toBe(1020);
  });

  it('reports zero homepage views rather than undefined when / is absent', async () => {
    const FETCH = reply([{ count: 5, dimensions: { requestPath: '/docs/', requestHost: 'seal-shot.com' } }]);
    const top = await fetchTopPages({ ...ENV, FETCH }, CURRENT);
    expect(top.homeViews).toBe(0);
  });
});
