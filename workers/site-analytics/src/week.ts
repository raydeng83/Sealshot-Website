/**
 * The reporting windows, in UTC days.
 *
 * Cron Triggers are UTC-only — Cloudflare exposes no timezone setting — so
 * every boundary here is a UTC midnight. That also matches license-fulfillment,
 * which dates every order with `toISOString().slice(0, 10)`. Mixing a local
 * calendar into the report would put a Sunday-evening Boston visit into the
 * wrong week relative to the order records.
 */

/** An inclusive range of UTC days, `YYYY-MM-DD` at both ends. */
export type Week = { start: string; end: string };

export type Windows = {
  /** The week being reported: the last complete Mon–Sun before `now`. */
  current: Week;
  /** The week before that, for the week-over-week comparison. */
  previous: Week;
};

const DAY_MS = 86_400_000;

function toDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The last COMPLETE Monday–Sunday week that ended before `now`, plus the one
 * before it.
 *
 * Complete is the point. Firing Monday 13:00 UTC, the obvious "past 7 days"
 * would be last Monday 13:00 to this Monday 13:00 — half of two different
 * Mondays, so a Monday spike is split across two reports and week-over-week
 * compares two ragged windows. Anchoring to whole days makes every report
 * cover the same seven weekdays, and makes the numbers reproducible: re-running
 * the cron an hour late, or by hand on Wednesday, still yields the same week.
 */
export function reportWindows(now: Date): Windows {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // getUTCDay is 0=Sunday. Shift so Monday is 0 and the arithmetic reads as
  // "days since the most recent Monday".
  const sinceMonday = (now.getUTCDay() + 6) % 7;
  const thisMonday = midnight - sinceMonday * DAY_MS;

  return {
    current: { start: toDay(thisMonday - 7 * DAY_MS), end: toDay(thisMonday - DAY_MS) },
    previous: { start: toDay(thisMonday - 14 * DAY_MS), end: toDay(thisMonday - 8 * DAY_MS) },
  };
}

/** The seven days of a week, in order. Used to print a row per day even when a day saw nothing. */
export function daysOf(week: Week): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${week.start}T00:00:00Z`); toDay(t) <= week.end; t += DAY_MS) {
    out.push(toDay(t));
  }
  return out;
}

/** Inclusive-end instants. The `end` day is a whole day, so it runs to 23:59:59. */
export function startISO(day: string): string { return `${day}T00:00:00Z`; }
export function endISO(day: string): string { return `${day}T23:59:59Z`; }

/** Unix seconds, for Analytics Engine's `toDateTime(<int>)`. */
export function startUnix(day: string): number { return Date.parse(startISO(day)) / 1000; }
/** Exclusive upper bound: the midnight AFTER `day`, so the whole day is included. */
export function endUnixExclusive(day: string): number {
  return Date.parse(`${day}T00:00:00Z`) / 1000 + 86_400;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Sep 1 – Sep 7`. Both months are always printed: a week can straddle two. */
export function formatRange(week: Week): string {
  return `${formatDay(week.start)} – ${formatDay(week.end)}`;
}

/** `Sep 1`. */
export function formatDay(day: string): string {
  const [, m, d] = day.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

/** `Mon`. Weekday of a UTC day string. */
export function weekdayOf(day: string): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${day}T00:00:00Z`).getUTCDay()];
}
