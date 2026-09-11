/**
 * The weekly email, as a pure function: data in, subject and body out.
 *
 * Pure so it is testable without a network, which matters more here than
 * usual — this runs unattended once a week, and a formatting mistake is seen
 * by a human only after it has already been sent.
 *
 * Every section degrades on its own. One failed query prints its reason in
 * place and the rest of the report still arrives, because a week's numbers
 * are worth more than an all-or-nothing guarantee.
 */
import type { Windows } from './week';
import { daysOf, formatDay, formatRange, weekdayOf } from './week';
import type { Traffic, TopPages } from './rum';
import type { Clicks } from './clicks';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type ReportData = {
  windows: Windows;
  traffic: Result<Traffic>;
  topPages: Result<TopPages>;
  clicks: Result<Clicks>;
};

/** `1,248`. Hand-rolled rather than toLocaleString so tests do not depend on ICU data. */
export function num(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** `14.1%`, or null when the denominator cannot support a rate. */
export function rate(numerator: number, denominator: number): string | null {
  if (!denominator) return null;
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

/**
 * `+18%` / `-4%` / `n/a`.
 *
 * A zero baseline yields "n/a", not "+100%" and not "+∞": going from 0 to 3
 * clicks is a real change with no meaningful percentage, and printing one
 * would put the report's least reliable number in its most quotable position.
 */
export function change(now: number, before: number): string {
  if (!before) return 'n/a';
  const pct = ((now - before) / before) * 100;
  const rounded = Math.round(pct);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function row(label: string, value: string, width = 28): string {
  return `  ${label.padEnd(width)}${value.padStart(9)}`;
}

export function renderReport(data: ReportData): { subject: string; text: string } {
  const { windows, traffic, topPages, clicks } = data;
  const period = formatRange(windows.current);
  const lines: string[] = [];

  lines.push('Sealshot Weekly Website Report', `${period} (UTC)`, '');

  // ── Headline numbers ────────────────────────────────────────────────────
  if (traffic.ok) {
    lines.push(row('Visits', num(traffic.value.current.visits)));
    lines.push(row('Page views', num(traffic.value.current.pageViews)));
  } else {
    lines.push(`  Traffic unavailable — ${traffic.error}`);
  }

  if (clicks.ok) {
    if (clicks.value.notYetCollecting) {
      lines.push('  Download clicks           not yet collecting');
    } else {
      lines.push(row('Download clicks (homepage)', num(clicks.value.current.home)));
      lines.push(row('Download starts (.dmg)', num(clicks.value.current.dmg)));
    }
  } else {
    lines.push(`  Download clicks unavailable — ${clicks.error}`);
  }

  // ── Conversion ──────────────────────────────────────────────────────────
  // The denominator is homepage PAGE VIEWS, not visits: the button being
  // measured is on the homepage, so the only honest denominator is how many
  // times that page was rendered. Visits would mix two systems' definitions
  // and quietly overstate the rate.
  //
  // There is deliberately NO "homepage click → .dmg start" ratio. /download/
  // is also reachable from the header on every page, so .dmg starts are not a
  // subset of homepage clicks — the ratio can legitimately exceed 100%, which
  // reads as a bug rather than as a funnel. The two counts stand on their own.
  if (clicks.ok && !clicks.value.notYetCollecting && topPages.ok && topPages.value.homeViews) {
    const home = clicks.value.current.home;
    const pct = rate(home, topPages.value.homeViews);
    if (pct) {
      lines.push('');
      lines.push(row('Homepage views → click', pct));
      lines.push(`  ${''.padEnd(28)}${`(${num(home)} of ${num(topPages.value.homeViews)})`.padStart(9)}`);
    }
  }

  // ── Top pages ───────────────────────────────────────────────────────────
  lines.push('', 'Top pages');
  if (!topPages.ok) {
    lines.push(`  unavailable — ${topPages.error}`);
  } else if (!topPages.value.paths.length) {
    lines.push('  no page views recorded');
  } else {
    topPages.value.paths.forEach(({ path, views }, i) => {
      lines.push(`  ${String(i + 1).padStart(2)}. ${path.padEnd(30)}${num(views).padStart(8)}`);
    });
  }

  // ── Daily ───────────────────────────────────────────────────────────────
  lines.push('', 'Daily');
  if (!traffic.ok) {
    lines.push(`  unavailable — ${traffic.error}`);
  } else {
    // Every day of the week is printed, including days with nothing. A missing
    // row reads as an outage; an explicit 0 reads as a quiet Sunday.
    for (const day of daysOf(windows.current)) {
      const at = traffic.value.byDay.get(day) ?? { pageViews: 0, visits: 0 };
      lines.push(
        `  ${weekdayOf(day)} ${formatDay(day).padEnd(8)}` +
          `${num(at.pageViews).padStart(7)} views  ${num(at.visits).padStart(6)} visits`
      );
    }
  }

  // ── Week over week ──────────────────────────────────────────────────────
  lines.push('', `Compared with ${formatRange(windows.previous)}`);
  const wow: string[] = [];
  if (traffic.ok) {
    wow.push(row('Visits', change(traffic.value.current.visits, traffic.value.previous.visits)));
    wow.push(
      row('Page views', change(traffic.value.current.pageViews, traffic.value.previous.pageViews))
    );
  }
  if (clicks.ok && !clicks.value.notYetCollecting) {
    wow.push(row('Download clicks', change(clicks.value.current.home, clicks.value.previous.home)));
  }
  lines.push(...(wow.length ? wow : ['  no comparable data']));

  // ── Provenance ──────────────────────────────────────────────────────────
  // Here so that nobody has to remember, six months from now, why this report
  // says "visits" when every other analytics product says "visitors".
  lines.push(
    '',
    '—',
    'Visits and page views come from Cloudflare Web Analytics. A "visit" is a',
    'page view arriving from another site or a direct link. Cloudflare Web',
    'Analytics is cookieless and stores no visitor identifier, so it has no',
    'unique-visitor metric and this report does not claim one.',
    '',
    'Download clicks are counted by the site itself. Both figures depend on',
    'JavaScript, so visitors who block it are missing from traffic and clicks',
    'alike — the rate between them is more trustworthy than either total.',
    '',
    '"Download starts" counts the .dmg link on /download/, which is also',
    'reachable from the header on every page — so it is not a subset of the',
    'homepage clicks above and the two are not a funnel.',
    '',
    'Days are UTC. Cron Triggers have no timezone setting.'
  );

  return { subject: `Sealshot weekly website report — ${period}`, text: lines.join('\n') };
}
