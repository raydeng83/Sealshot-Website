import { handleEvent, type EventEnv } from './event';
import { fetchTraffic, fetchTopPages, type RumEnv } from './rum';
import { fetchClicks, type ClicksEnv } from './clicks';
import { renderReport, type Result } from './report';
import { recipients, sendReport } from './email';
import { reportWindows, startUnix, endUnixExclusive } from './week';

export interface Env extends EventEnv, RumEnv, ClicksEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  REPORT_TO?: string;
  /**
   * Set in .dev.vars to compose the report and log it instead of sending. The
   * whole scheduled path then runs for real against the real APIs, which is
   * the only way to test the query and the formatting together without putting
   * mail in somebody's inbox.
   */
  DRY_RUN?: string;
  FETCH?: typeof fetch; // test injection only
}

/** Turn a rejection into a value, so one dead query cannot take the email with it. */
async function attempt<T>(work: Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await work };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Exported so tests and a manual run can build the report without sending it. */
export async function buildReport(env: Env, now: Date) {
  const windows = reportWindows(now);
  const { current, previous } = windows;

  const inWeek = (day: string): 'current' | 'previous' | null => {
    if (day >= current.start && day <= current.end) return 'current';
    if (day >= previous.start && day <= previous.end) return 'previous';
    return null;
  };

  // Three independent reads, so they run together — the cron has no deadline
  // pressure, but a serial chain would make one slow query delay the others'
  // failure messages too.
  const [traffic, topPages, clicks] = await Promise.all([
    attempt(fetchTraffic(env, current, previous)),
    attempt(fetchTopPages(env, current)),
    attempt(
      fetchClicks(
        env,
        { startUnix: startUnix(current.start), endUnixExclusive: endUnixExclusive(current.end) },
        { startUnix: startUnix(previous.start), endUnixExclusive: endUnixExclusive(previous.end) },
        inWeek
      )
    ),
  ]);

  return renderReport({ windows, traffic, topPages, clicks });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/e') {
      // sendBeacon posts text/plain, which is CORS-safelisted and so never
      // preflights — that is why the site uses a text/plain Blob rather than
      // application/json. This answers a preflight anyway, so a fetch-based
      // caller also works.
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': request.headers.get('origin') ?? '',
            'access-control-allow-headers': 'content-type',
            'access-control-allow-methods': 'POST, OPTIONS',
            vary: 'Origin',
          },
        });
      }
      return handleEvent(request, env);
    }

    return new Response('not found', { status: 404 });
  },

  /**
   * Monday 13:00 UTC — 9am Boston under EDT, 8am under EST. Cron Triggers are
   * UTC-only, so that hour drifts with US daylight saving and there is no
   * setting that would stop it.
   */
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const { subject, text } = await buildReport(env, new Date());

    if (env.DRY_RUN) {
      console.log(`[weekly-report] DRY_RUN, not sending\nTo: ${recipients(env.REPORT_TO).join(', ')}\nSubject: ${subject}\n\n${text}`);
      return;
    }

    const to = recipients(env.REPORT_TO);
    if (!to.length) {
      console.error('[weekly-report] REPORT_TO is empty — nobody to send to');
      return;
    }
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      console.error('[weekly-report] RESEND_API_KEY or EMAIL_FROM missing — not sent');
      return;
    }

    const sent = await sendReport({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      fetchImpl: env.FETCH,
    });

    // The report is regenerated from scratch every week, so a failed send is
    // not worth a retry queue — next Monday's report supersedes it. The log is
    // the whole alerting story here, which is why [observability] is enabled.
    if (!sent.ok) {
      console.error(`[weekly-report] send failed: HTTP ${sent.status} ${sent.error ?? ''}`);
    }
  },
};
