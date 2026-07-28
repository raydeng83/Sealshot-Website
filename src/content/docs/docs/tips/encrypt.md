---
title: "Tips: Encrypt"
description: Live with Enhanced Security without locking yourself out — recovery codes, what's actually encrypted, and why capture never waits.
---

[Enhanced Security](/docs/guide/security/) starts protecting your captures
the moment they're taken. These are the things worth knowing before and
after you turn it on.

:::caution
Lose both your Mac's unlock methods and your recovery code and the
encrypted captures are gone — **there is no support channel that can recover
them**, because there is no copy anywhere but your Mac. That's the trade for on-device-only privacy.
:::

## Turning it on

- **Turn it on at any time.** Enabling Enhanced Security encrypts each item
  one by one. The processing time depends on how large your captures (images
  and videos) are, but in general it's a fairly fast operation.
- **The recovery code belongs in your password manager.** There's no
  account and no cloud backup, so if your Mac's keychain is ever lost, that
  [recovery code](/docs/guide/security/#save-your-recovery-code) is the only
  way back into your own library. Write it down somewhere that isn't the Mac
  it protects.
- **Periodic recovery-code checks.** Sealshot occasionally prompts you to
  validate your recovery code, so you find out it's misplaced before you
  need it.

## What it actually covers

- **It's not just the images.** Captures and recordings are AES-256-GCM
  encrypted on disk — and so are the **search index, the undo history, and
  the extracted OCR text**. Those are exactly the places a readable copy of
  your content would otherwise sit in the clear. See
  [what it protects](/docs/guide/security/#what-it-protects).
- **Nobody can quietly switch it off.** The Privacy & Security settings
  themselves require authentication to open, so an unlocked Mac left alone
  isn't a way in.

## Recovery code & key

- **View or update recovery code.** Recovery code
  → View… or Generate New… in [Settings → Privacy &
  Security](/docs/guide/settings/#privacy--security); a new code retires the
  old one.
- **You can rotate the key itself.** **Replace encryption key** changes the
  underlying encryption key, not just the code that recovers it.

## Others

- **Auto-lock.** Sealshot can [lock](/docs/guide/security/#locking) the
  library on its own when you step away — capturing still works while
  locked, so you never miss a shot.

