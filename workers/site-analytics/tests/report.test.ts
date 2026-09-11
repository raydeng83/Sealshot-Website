import { describe, it, expect } from 'vitest';
import { renderReport, num, rate, change, type ReportData } from '../src/report';
import { reportWindows } from '../src/week';

const WINDOWS = reportWindows(new Date('2026-09-14T13:00:00Z')); // Sep 7–13, prev Aug 31–Sep 6

function data(over: Partial<ReportData> = {}): ReportData {
  return {
    windows: WINDOWS,
    traffic: {
      ok: true,
      value: {
        current: { pageViews: 2931, visits: 1248 },
        previous: { pageViews: 2688, visits: 1058 },
        byDay: new Map([
          ['2026-09-07', { pageViews: 402, visits: 180 }],
          ['2026-09-08', { pageViews: 388, visits: 171 }],
        ]),
      },
    },
    topPages: {
      ok: true,
      value: {
        paths: [
          { path: '/', views: 1020 },
          { path: '/guides/', views: 386 },
        ],
        homeViews: 1020,
      },
    },
    clicks: {
      ok: true,
      value: { current: { home: 176, dmg: 131 }, previous: { home: 157, dmg: 118 }, notYetCollecting: false },
    },
    ...over,
  };
}

describe('number formatting', () => {
  it('groups thousands', () => {
    expect(num(1248)).toBe('1,248');
    expect(num(2931)).toBe('2,931');
    expect(num(0)).toBe('0');
    expect(num(999)).toBe('999');
    expect(num(1000000)).toBe('1,000,000');
  });

  it('computes a rate to one decimal, and refuses a zero denominator', () => {
    expect(rate(176, 1020)).toBe('17.3%');
    expect(rate(0, 10)).toBe('0.0%');
    expect(rate(5, 0)).toBeNull();
  });

  it('reports change against a zero baseline as n/a, not +100% or infinity', () => {
    // 0 → 3 clicks is a real change with no meaningful percentage; printing one
    // would put the least reliable number in the most quotable position.
    expect(change(3, 0)).toBe('n/a');
    expect(change(118, 100)).toBe('+18%');
    expect(change(90, 100)).toBe('-10%');
    expect(change(100, 100)).toBe('0%');
  });
});

describe('renderReport', () => {
  it('titles the report with the reporting period', () => {
    const { subject, text } = renderReport(data());
    expect(subject).toBe('Sealshot weekly website report — Sep 7 – Sep 13');
    expect(text).toContain('Sealshot Weekly Website Report');
    expect(text).toContain('Sep 7 – Sep 13 (UTC)');
  });

  it('reports visits and page views, and both download figures', () => {
    const { text } = renderReport(data());
    expect(text).toMatch(/Visits\s+1,248/);
    expect(text).toMatch(/Page views\s+2,931/);
    expect(text).toMatch(/Download clicks \(homepage\)\s+176/);
    expect(text).toMatch(/Download starts \(\.dmg\)\s+131/);
  });

  it('never claims unique visitors, and says why', () => {
    // Cloudflare Web Analytics is cookieless and stores no visitor identifier,
    // so uniqueness is not measured at all. Claiming it would be invention.
    const { text } = renderReport(data());
    expect(text).not.toMatch(/unique visitors:/i);
    expect(text).not.toMatch(/^\s*Visitors\b/m);
    // Matched without the preceding "no", which the body wraps onto the line above.
    expect(text).toContain('unique-visitor metric');
  });

  it('rates the click against homepage page views, showing the denominator', () => {
    const { text } = renderReport(data());
    expect(text).toMatch(/Homepage views → click\s+17\.3%/);
    expect(text).toContain('(176 of 1,020)');
  });

  it('does not present the two click counts as a funnel', () => {
    // /download/ is reachable from the header on every page, so .dmg starts
    // are not a subset of homepage clicks and the ratio could exceed 100%.
    const { text } = renderReport(data());
    expect(text).not.toContain('Click → .dmg');
    expect(text).toContain('not a subset of the');
  });

  it('lists top pages in order', () => {
    const { text } = renderReport(data());
    expect(text).toMatch(/1\. \/\s+1,020/);
    expect(text).toMatch(/2\. \/guides\/\s+386/);
  });

  it('prints every day of the week, including days with no traffic', () => {
    // A missing row reads as an outage; an explicit 0 reads as a quiet Sunday.
    const { text } = renderReport(data());
    for (const d of ['Mon Sep 7', 'Tue Sep 8', 'Wed Sep 9', 'Sun Sep 13']) {
      expect(text).toContain(d);
    }
    expect(text).toMatch(/Wed Sep 9\s+0 views/);
  });

  it('compares with the previous week by name', () => {
    const { text } = renderReport(data());
    expect(text).toContain('Compared with Aug 31 – Sep 6');
    expect(text).toMatch(/Visits\s+\+18%/);
    expect(text).toMatch(/Download clicks\s+\+12%/);
  });
});

describe('renderReport degrades one section at a time', () => {
  it('keeps traffic when top pages fail, and says what broke', () => {
    const { text } = renderReport(data({ topPages: { ok: false, error: 'requestPath unavailable' } }));
    expect(text).toMatch(/Visits\s+1,248/);
    expect(text).toContain('unavailable — requestPath unavailable');
    // No denominator means no rate — better absent than wrong.
    expect(text).not.toContain('Homepage views → click');
  });

  it('keeps clicks when traffic fails', () => {
    const { text } = renderReport(data({ traffic: { ok: false, error: 'GraphQL HTTP 403' } }));
    expect(text).toContain('Traffic unavailable — GraphQL HTTP 403');
    expect(text).toMatch(/Download clicks \(homepage\)\s+176/);
  });

  it('distinguishes "not yet collecting" from zero clicks', () => {
    const { text } = renderReport(
      data({ clicks: { ok: true, value: { current: { home: 0, dmg: 0 }, previous: { home: 0, dmg: 0 }, notYetCollecting: true } } })
    );
    expect(text).toContain('not yet collecting');
    expect(text).not.toContain('Homepage views → click');
  });

  it('still renders when everything fails', () => {
    const { text } = renderReport(
      data({
        traffic: { ok: false, error: 'a' },
        topPages: { ok: false, error: 'b' },
        clicks: { ok: false, error: 'c' },
      })
    );
    expect(text).toContain('Sealshot Weekly Website Report');
    expect(text).toContain('no comparable data');
  });
});
