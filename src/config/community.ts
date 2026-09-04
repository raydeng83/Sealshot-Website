/**
 * Where the community actually lives.
 *
 * One source of truth for every "come and talk to us" link on the site, so a
 * channel that moves is fixed in one file rather than hunted through markup.
 *
 * The rule this file exists to enforce: NOTHING HERE POINTS AT A PLACE THAT
 * DOES NOT EXIST. Checked against the repo on 2026-09-03 —
 *
 *   github.com/ldeng83/Sealshot         has_issues: true, has_discussions: FALSE
 *   github.com/ldeng83/Sealshot/discussions   → 404
 *
 * so /community/ routes its open-ended invitations to the support form, which
 * is a real inbox (workers/license-fulfillment/src/feedback.ts), and its
 * specific ones to issues, which are real too. See DISCUSSIONS_ENABLED below.
 */

/** The app repo. Public, GPL-3, and the only Sealshot repo still in use —
    Sealshot-Release was consolidated into it. */
export const REPO_URL = 'https://github.com/ldeng83/Sealshot';

export const ISSUES_URL = `${REPO_URL}/issues`;
export const RELEASES_URL = `${REPO_URL}/releases`;

/**
 * Private vulnerability reporting, as SECURITY.md in the repo directs: "Please
 * don't open a public issue, pull request, or discussion for a security
 * problem." A community page that invites people to file issues has to say
 * where the exception goes, or it is quietly asking for a disclosure in public.
 */
export const SECURITY_ADVISORY_URL = `${REPO_URL}/security/advisories/new`;

/**
 * Pre-labelled new-issue links. `?labels=` is honoured for anyone with triage
 * rights and ignored — not rejected — for everyone else, so the link works
 * either way and maintainers get the sorting for free when it does apply.
 *
 * Only labels that exist on the repo: bug, enhancement, question,
 * documentation, help wanted, good first issue. No `?template=` parameters:
 * the repo has no .github/ISSUE_TEMPLATE, so every one of those would be
 * invented.
 */
const newIssue = (labels: string) => `${ISSUES_URL}/new?labels=${encodeURIComponent(labels)}`;

export const REPORT_BUG_URL = newIssue('bug');
export const REQUEST_FEATURE_URL = newIssue('enhancement');

/** The site's own feedback form. A real backend that already exists, already
    works with JavaScript off, and needs nothing built to reuse. */
export const SUPPORT_URL = '/support/';

/**
 * ── Turning Discussions on ───────────────────────────────────────────────
 *
 * Discussions is OFF for the repo today, which is why nothing below links to
 * it. To switch:
 *
 *   1. GitHub → the repo → Settings → General → Features → tick Discussions.
 *   2. Flip this to `true`.
 *
 * That is the whole change: the three open-ended calls to action on
 * /community/ — share feedback, share your workflow, share an idea — move from
 * the support form to Discussions, and nothing else on the site moves.
 *
 * Category links (Ideas, Q&A, Show and tell) are deliberately absent. Their
 * URLs contain numeric ids that cannot be known before the categories are
 * created, and a guessed one 404s exactly like the bare /discussions link this
 * flag is here to prevent.
 */
export const DISCUSSIONS_ENABLED = false;

const DISCUSSIONS_URL = `${REPO_URL}/discussions`;

/** Where an open-ended "here is what I think" goes. */
export const FEEDBACK_HREF = DISCUSSIONS_ENABLED ? DISCUSSIONS_URL : SUPPORT_URL;

/** Where "here is how I work, and what gets in my way" goes. Same destination
    as feedback today; kept separate so the two can diverge (a Show-and-tell
    category, say) without touching the page. */
export const WORKFLOW_HREF = FEEDBACK_HREF;

/**
 * Where "you should build this" goes. An idea is concrete enough to be an
 * issue, so this stays on the tracker even once Discussions exists — it is the
 * one open-ended CTA that already has a better home.
 */
export const IDEA_HREF = REQUEST_FEATURE_URL;
