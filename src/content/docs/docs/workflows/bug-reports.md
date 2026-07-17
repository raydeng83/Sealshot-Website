---
title: "Workflow: report a bug without leaking your stack"
description: Capture a repro, annotate the steps, redact your secrets, and attach it to the ticket.
---

Bug reports are where secrets escape: a screenshot of a stack trace carries
your API keys, session tokens, and internal URLs straight into Jira, Slack,
or a public issue tracker. This workflow gets the evidence into the ticket
— and nothing else.

## The walkthrough

1. **Capture the repro.** Press **⌘⇧C** and grab the failing window — hover
   highlights it with [smart boundary detection](/docs/guide/capture/), or
   drag an exact region. For a bug that needs motion, press **⌘⇧R** and
   [record](/docs/guide/recording/) the region instead.

2. **Number the steps.** Use the
   [numbered badges tool](/docs/guide/editor/#annotation-tools) to mark
   *1 → 2 → 3* on the UI in the order that triggers the bug, and an arrow
   for the moment it goes wrong. Badges auto-increment as you click.

3. **Redact before it leaves.** Click **Smart Redact** — the
   [on-device scan](/docs/guide/redaction/) flags API keys, tokens, JWTs,
   emails, and URLs with embedded credentials, pre-checked. Apply covers
   them with solid fill, which is **unrecoverable in the export** — not a
   blur someone can undo.

   ![The redaction review panel over a capture full of secrets](/manual/redaction-review.png)

4. **Export and attach.** **⌘S** writes a flattened PNG (annotations and
   redactions baked in); recordings export to `.mp4`/`.mov` via **File →
   Export to Video…**. The editable `.seal` original stays in your library,
   un-flattened, in case you need a different crop tomorrow.

5. **Find it again in three weeks.** When the ticket bounces back, don't
   re-reproduce — [search](/docs/guide/library/#search) for the error
   message text. OCR indexed every capture the moment you took it.

:::tip
Turn on **Scan captures automatically** (Settings → On-Device AI) if you
screenshot terminals all day — every capture gets checked for secrets the
moment it opens, before you can forget.
:::
