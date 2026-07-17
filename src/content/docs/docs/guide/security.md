---
title: Enhanced Security
description: Encrypt your captures at rest and lock viewing behind Touch ID.
---

Enhanced Security encrypts everything Sealshot stores on your Mac and locks
viewing behind Touch ID. Capturing always works — even while locked — so you
never miss a shot; only *viewing* your library requires you to unlock.

## What it protects

When Enhanced Security is on:

- Stored captures **and recordings** are **encrypted on disk** (AES-256-GCM).
- The **search index, undo history, and extracted OCR text** are encrypted
  too.
- Viewing requires **Touch ID**, your Apple Watch, or your Mac's password.
- A **recovery code** is created at setup, in case your Mac's keys are ever
  lost.
- The **Privacy & Security settings themselves** require authentication to
  open, so no one can quietly change them.

## Turning it on

Open **Settings → Privacy & Security** and turn on **Enhanced security**.
Sealshot encrypts your existing captures (a progress bar shows the work) and
then walks you through the recovery-key ceremony.

![The Enhanced security setting](/manual/security-setting.png)
*Enable Enhanced security in Settings → Privacy & Security.*

### Save your recovery code

During setup Sealshot shows a **recovery code**. Store it somewhere safe (a
password manager is ideal). If your Mac's keychain is ever lost, this code
is the only way back into your encrypted library.

If you lose it (but can still unlock), open **Settings → Privacy &
Security** and use **Recovery code → View…** or **Generate New…** — a new
code replaces the old one. **Replace encryption key** rotates the underlying
encryption key itself.

![The recovery-key ceremony](/manual/security-recovery-key.png)
*Save the recovery code somewhere safe.*

:::caution
There is no account and no cloud backup. If you lose **both** your Mac's
unlock methods **and** your recovery code, your encrypted captures cannot be
recovered. That's the price of true on-device privacy.
:::

## Unlocking

When the library is locked, Sealshot shows a lock screen. Authenticate with
Touch ID, Apple Watch, or your password to view your captures.

![The lock screen](/manual/lock-screen.png)
*Unlock with Touch ID, Apple Watch, or your Mac password.*

## Locking

Set Sealshot to re-lock automatically after a period of inactivity — **Off**
(default), **1**, **5**, or **15 minutes** — in **Settings → Privacy &
Security → Auto-lock when idle**. Idle means you've stepped away from the
Mac (no keyboard or mouse activity anywhere, the same signal the
screensaver uses) — working in another app doesn't count as idle, and an
in-progress capture or recording is never interrupted. Sealshot also locks
when the Mac sleeps, the screen sleeps, or you switch users, and you can
lock on demand from anywhere with **⌘⇧L** (Lock now).

While locked, everything that could reveal your library goes quiet: the
editor, Library, import/export menus, and the open-editor / open-library /
clipboard shortcuts are all disabled. **Capture and recording shortcuts
keep working** — new captures are written encrypted, sight unseen, and wait
for you to unlock.

## Turning it off

Toggle Enhanced security off to decrypt your library again. You'll be asked to
authenticate, and Sealshot removes encryption from all captures on your Mac.
