---
title: "Tips: Encrypt"
description: Live with Enhanced Security without locking yourself out — recovery codes, what's actually encrypted, and why capture never waits.
---

[Enhanced Security](/docs/guide/security/) is one switch, and then it's
invisible. These are the things worth knowing before and after you flip it.

## Before you turn it on

- **Turn it on early.** Enabling it encrypts the captures you already have,
  with a progress bar while it works — much shorter on a small library than
  on three years of screenshots.
- **The recovery code belongs in your password manager.** There's no
  account and no cloud backup, so if your Mac's keychain is ever lost, that
  [recovery code](/docs/guide/security/#save-your-recovery-code) is the only
  way back into your own library. Write it down somewhere that isn't the Mac
  it protects.

## What it actually covers

- **It's not just the images.** Captures and recordings are AES-256-GCM
  encrypted on disk — and so are the **search index, the undo history, and
  the extracted OCR text**. Those are exactly the places a readable copy of
  your content would otherwise sit in the clear. See
  [what it protects](/docs/guide/security/#what-it-protects).
- **Nobody can quietly switch it off.** The Privacy & Security settings
  themselves require authentication to open, so an unlocked Mac left alone
  isn't a way in.

## Living with it

- **You never miss a shot while locked.** Capturing keeps working even when
  the library is locked — it just saves encrypted. Only *viewing* needs you
  to [unlock](/docs/guide/security/#unlocking).
- **Your Apple Watch unlocks it too**, not only Touch ID — and your Mac's
  password always works as the fallback.
- **Let auto-lock do its job.** [Locking](/docs/guide/security/#locking) on
  its own when you step away is the whole point; re-authenticating takes a
  second and it's the difference between encryption that helps and
  encryption that only helps when the Mac is off.

## If something changes

- **You can see the recovery code again** — or replace it. **Recovery code
  → View…** or **Generate New…** in [Settings → Privacy &
  Security](/docs/guide/settings/#privacy--security); a new code retires the
  old one.
- **You can rotate the key itself.** **Replace encryption key** changes the
  underlying encryption key, not just the code that recovers it.

:::caution
Lose both your Mac's unlock methods **and** your recovery code and the
encrypted captures are gone — there is no support channel that can recover
them, because there is no copy anywhere but your Mac. That's the trade you
accepted for on-device-only privacy.
:::
