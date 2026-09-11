import { describe, it, expect } from 'vitest';
import {
  reportWindows, daysOf, formatRange, formatDay, weekdayOf, startUnix, endUnixExclusive,
} from '../src/week';

describe('reportWindows', () => {
  it('reports the last COMPLETE Mon-Sun when the cron fires Monday 13:00 UTC', () => {
    // 2026-09-14 is a Monday.
    const w = reportWindows(new Date('2026-09-14T13:00:00Z'));
    expect(w.current).toEqual({ start: '2026-09-07', end: '2026-09-13' });
    expect(w.previous).toEqual({ start: '2026-08-31', end: '2026-09-06' });
  });

  it('never includes the day it runs on', () => {
    // The whole point of whole-day anchoring: a partial Monday in the report
    // would be counted again next week.
    const w = reportWindows(new Date('2026-09-14T23:59:59Z'));
    expect(w.current.end).toBe('2026-09-13');
  });

  it('is stable across the hour, so a late or hand-run cron reports the same week', () => {
    const early = reportWindows(new Date('2026-09-14T00:00:00Z'));
    const late = reportWindows(new Date('2026-09-14T13:00:00Z'));
    expect(early).toEqual(late);
  });

  it('still reports the previous week when run mid-week by hand', () => {
    const w = reportWindows(new Date('2026-09-16T09:30:00Z')); // a Wednesday
    expect(w.current).toEqual({ start: '2026-09-07', end: '2026-09-13' });
  });

  it('treats Sunday as the end of the week it belongs to, not the start of the next', () => {
    // getUTCDay() is 0 for Sunday; the (day + 6) % 7 shift is what makes this work.
    const w = reportWindows(new Date('2026-09-13T12:00:00Z')); // Sunday
    expect(w.current).toEqual({ start: '2026-08-31', end: '2026-09-06' });
  });

  it('crosses a month boundary', () => {
    const w = reportWindows(new Date('2026-10-05T13:00:00Z'));
    expect(w.current).toEqual({ start: '2026-09-28', end: '2026-10-04' });
  });

  it('crosses a year boundary', () => {
    const w = reportWindows(new Date('2027-01-04T13:00:00Z'));
    expect(w.current).toEqual({ start: '2026-12-28', end: '2027-01-03' });
    expect(w.previous).toEqual({ start: '2026-12-21', end: '2026-12-27' });
  });
});

describe('daysOf', () => {
  it('yields exactly seven days in order', () => {
    const days = daysOf({ start: '2026-09-07', end: '2026-09-13' });
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-09-07');
    expect(days[6]).toBe('2026-09-13');
  });

  it('spans a month boundary without skipping or repeating', () => {
    const days = daysOf({ start: '2026-08-31', end: '2026-09-06' });
    expect(days).toEqual([
      '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03',
      '2026-09-04', '2026-09-05', '2026-09-06',
    ]);
  });
});

describe('formatting', () => {
  it('prints a readable range', () => {
    expect(formatRange({ start: '2026-09-01', end: '2026-09-07' })).toBe('Sep 1 – Sep 7');
  });
  it('names both months when the week straddles them', () => {
    expect(formatRange({ start: '2026-08-31', end: '2026-09-06' })).toBe('Aug 31 – Sep 6');
  });
  it('drops the leading zero from the day', () => {
    expect(formatDay('2026-09-01')).toBe('Sep 1');
  });
  it('names the UTC weekday', () => {
    expect(weekdayOf('2026-09-14')).toBe('Mon');
    expect(weekdayOf('2026-09-13')).toBe('Sun');
  });
});

describe('unix bounds for Analytics Engine', () => {
  it('starts at midnight UTC', () => {
    expect(startUnix('2026-09-07')).toBe(Date.parse('2026-09-07T00:00:00Z') / 1000);
  });

  it('ends at the midnight AFTER the last day, so the last day is whole', () => {
    // An inclusive `end` of 23:59:59 would drop the final second of the week.
    expect(endUnixExclusive('2026-09-13')).toBe(Date.parse('2026-09-14T00:00:00Z') / 1000);
  });
});
