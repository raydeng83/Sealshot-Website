import { describe, it, expect, vi } from 'vitest';
import { fetchClicks } from '../src/clicks';

const ENV = { CF_ACCOUNT_ID: 'a'.repeat(32), CF_API_TOKEN: 'tok' };
const CURRENT = { startUnix: 1_757_203_200, endUnixExclusive: 1_757_808_000 };
const PREVIOUS = { startUnix: 1_756_598_400, endUnixExclusive: 1_757_203_200 };

const inWeek = (day: string): 'current' | 'previous' | null => {
  if (day >= '2026-09-07' && day <= '2026-09-13') return 'current';
  if (day >= '2026-08-31' && day <= '2026-09-06') return 'previous';
  return null;
};

function reply(data: unknown[], status = 200) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ data }), { status }));
}

describe('fetchClicks', () => {
  it('tallies each label into its own week', async () => {
    const FETCH = reply([
      { label: 'home', day: '2026-09-07', clicks: 100 },
      { label: 'home', day: '2026-09-08', clicks: 76 },
      { label: 'dmg', day: '2026-09-07', clicks: 131 },
      { label: 'home', day: '2026-09-01', clicks: 157 },
    ]);
    const c = await fetchClicks({ ...ENV, FETCH }, CURRENT, PREVIOUS, inWeek);
    expect(c.current).toEqual({ home: 176, dmg: 131 });
    expect(c.previous).toEqual({ home: 157, dmg: 0 });
    expect(c.notYetCollecting).toBe(false);
  });

  it('reads 64-bit counts returned as JSON strings', async () => {
    // ClickHouse renders 64-bit integers as strings; SUM(_sample_interval) is one.
    const FETCH = reply([{ label: 'home', day: '2026-09-07', clicks: '42' }]);
    const c = await fetchClicks({ ...ENV, FETCH }, CURRENT, PREVIOUS, inWeek);
    expect(c.current.home).toBe(42);
  });

  it('ignores rows outside both weeks and labels it does not know', async () => {
    const FETCH = reply([
      { label: 'home', day: '2026-07-01', clicks: 999 },
      { label: 'mystery', day: '2026-09-07', clicks: 999 },
    ]);
    const c = await fetchClicks({ ...ENV, FETCH }, CURRENT, PREVIOUS, inWeek);
    expect(c.current).toEqual({ home: 0, dmg: 0 });
  });

  it('treats a missing dataset as "not yet collecting", not as an error', async () => {
    // Analytics Engine creates the dataset on first write, so this is the
    // expected state of the very first report and must not fail the email.
    const FETCH = vi.fn<typeof fetch>(async () => new Response('unknown table sealshot_site_events', { status: 404 }));
    const c = await fetchClicks({ ...ENV, FETCH }, CURRENT, PREVIOUS, inWeek);
    expect(c.notYetCollecting).toBe(true);
    expect(c.current).toEqual({ home: 0, dmg: 0 });
  });

  it('still throws on a real API failure', async () => {
    const FETCH = vi.fn<typeof fetch>(async () => new Response('authentication error', { status: 403 }));
    await expect(fetchClicks({ ...ENV, FETCH }, CURRENT, PREVIOUS, inWeek)).rejects.toThrow(/403/);
  });

  it('counts with SUM(_sample_interval), never COUNT()', async () => {
    // COUNT() is right at today's volume and silently wrong once Analytics
    // Engine starts downsampling.
    const FETCH = reply([]);
    await fetchClicks({ ...ENV, FETCH }, CURRENT, PREVIOUS, inWeek);
    const sql = (FETCH.mock.calls[0][1] as RequestInit).body as string;
    expect(sql).toContain('SUM(_sample_interval)');
    expect(sql).not.toMatch(/COUNT\(/i);
    // GROUP BY must name the ALIASES. Analytics Engine answers 422 to an
    // expression here — "you may only provide column names" — despite the SQL
    // reference saying otherwise. Verified against the live API 2026-09-09.
    // This assertion previously encoded the expression form and so passed
    // while production would have failed.
    expect(sql).toContain('GROUP BY label, day');
    expect(sql).not.toMatch(/GROUP BY.*formatDateTime/);
    expect(sql).toContain(`toDateTime(${PREVIOUS.startUnix})`);
    expect(sql).toContain(`toDateTime(${CURRENT.endUnixExclusive})`);
  });
});
