---
title: How to Detect API Keys and Tokens in Screenshots
description: Secrets leak through screenshots of terminals, dashboards, and .env files. How to spot API keys and tokens in an image before you paste it into a ticket or a chat.
summary: The screenshot of your terminal has a token in it. How to catch that before it reaches a public thread.
order: 80
---

Secret scanners watch commits. Almost nothing watches the screenshot of the
terminal that printed the secret — and that image goes into chats, tickets, and
slide decks with far less ceremony than a commit.

This guide will cover where keys hide in a capture (shell history, response
panes, config files, environment listings), the shapes common tokens take, what
to do the moment one has been shared, and how automatic detection at capture
time removes the need to notice.

Sealshot's Smart Redaction finds keys and tokens on device and pre-selects them
for solid-fill redaction. See [Redaction](/docs/guide/redaction/).

*The full guide is being written. In the meantime the documentation above covers
the same ground.*
