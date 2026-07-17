---
title: "Workflow: share sensitive documents safely"
description: Capture statements and IDs, redact what matters, and send an encrypted package.
---

Bank statements, IDs, medical paperwork, contracts — sometimes you have to
capture and share them. This workflow keeps a document protected at every
step: detected, redacted, encrypted at rest, and encrypted in transit.

## The walkthrough

1. **Capture the document** with **⌘⇧C**, or a
   [scrolling capture](/docs/guide/capture/#scrolling-capture) (**⌘⇧W**)
   for a long statement.

2. **Let document-aware redaction read it.** Run **Smart Redact** — with
   the [enhanced on-device model](/docs/guide/redaction/#the-enhanced-on-device-model),
   Sealshot recognizes *what kind* of document it's looking at and applies
   tuned detection: account and card numbers, SSNs, passport MRZ lines,
   addresses, money amounts on financial documents. High-risk items start
   pre-checked; review the list and Apply.

3. **Keep the original sealed.** With
   [Enhanced Security](/docs/guide/security/) on, the un-redacted original
   sits encrypted on disk (AES-256-GCM), viewable only after Touch ID. Step
   away and auto-lock takes over; capturing still works while locked.

4. **Export an encrypted package.** Select the capture and press **⇧⌘E** —
   [Export to Package](/docs/guide/sharing/) generates a strong passcode
   (copy it before export unlocks), takes an optional expiry date and hint,
   and writes a `.sealshare` only Sealshot + passcode can open.

   ![The Export to Package dialog](/manual/export-package.png)

5. **Send the passcode separately.** Package by email, passcode by Signal
   or a phone call — never the same channel. The recipient double-clicks
   the package, enters the passcode, and chooses **Add to Library** or
   **Save to Folder…**.

:::caution
The exported package contains the **redacted** result unless you
deliberately enable *Include original un-redacted capture* — leave that
off unless the recipient genuinely needs the original.
:::
