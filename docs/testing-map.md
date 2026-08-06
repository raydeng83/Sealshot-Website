# Sealshot — testing map

A tester brief: what the app is, what we want from you, the scenarios to run, and
how to report. Read 1 and 2, work through 3, report as in 4.

---

## 1. Sealshot intro

### The app

A screenshot and screen-recording tool for macOS 14 and later, universal for
Apple Silicon and Intel. Everything runs on the Mac — capture, OCR, redaction,
AI, search. No account, no telemetry.

- **Capture** — area, window, fullscreen, delayed, and scrolling with stitching
- **Record** — screen, window, or region, with system audio and mic
- **Annotate** — shapes, arrows, pen, text, numbered badges, each on its own layer
- **Redact** — Smart Redaction finds credentials and covers them permanently
- **Data extract** — titles, summaries, keywords, tables, form fields
- **Organize and search** — collections, favorites, tags, OCR full-text search
- **Share** — `.sealshare` packages, optionally passcode-encrypted with an expiry
- **Encryption** — Enhanced Security is opt-in: AES-256-GCM on disk behind Touch ID

### seal-shot.com

Website for Sealshot. Documentation covers a lot of details of the app.

**Access:** Access is restricted from public right now. You can get a login code if you have a @bostonidentity.com email

## 2. Objective

Test objective mainly covers two parts.

### Function and UI

- It does what it claims, on your hardware.
- User interface looks correct.

### Usability

- App is convenient to use
- User experience is good

## 3. Testing map

Below is a testing map that you can follow to drive through the app.

### Everyday capture

#### Capture, Annotate and Export

1. Capture a screenshot (area, window, delayed, or full screen)
2. Add shapes, arrows, text, numbered badges
3. Get it into another app — clipboard, drag, or export to file

**Fails if:** wrong region, scale, or display; annotations shift or blur on
export; the receiving app gets nothing, or the unannotated original.

**Docs:** [Capture modes](https://seal-shot.com/docs/guide/capture/#smart-capture-area--window) · [Annotation tools](https://seal-shot.com/docs/guide/editor/#annotation-tools)

#### Scroll Capture and Verify

1. Capture a page, thread, or document longer than the screen
2. Inspect at 100% zoom, not thumbnail size
3. Check the seams, repeated bands, and the tail

**Fails if:** stitch lines, duplicated or skipped content, or a capture that
stopped early.

**Docs:** [Scrolling capture](https://seal-shot.com/docs/guide/capture/#scrolling-capture)

#### Capture Straight to File

1. Capture with the fewest steps the app allows — no editor
2. Find the file on disk
3. Open it in another app

**Fails if:** UI you didn't ask for, a file in the wrong place, or one other apps
can't open.

**Docs:** [Where captures go](https://seal-shot.com/docs/guide/capture/#where-captures-go) · [General settings](https://seal-shot.com/docs/guide/settings/#general)

### Recording

#### Record with Narration, Pause and Resume

1. Record part of the screen with mic audio
2. Pause halfway, switch apps, resume
3. Play the result on another machine

**Fails if:** missing or desynced audio, the pause eating content, or a file
QuickTime won't play.

**Docs:** [Starting a recording](https://seal-shot.com/docs/guide/recording/#starting-a-recording) · [While recording](https://seal-shot.com/docs/guide/recording/#while-recording)

#### Extract from a Recording

1. Open a finished recording
2. Pull out something other than the video — text, moments, a summary
3. Check it against what is actually in the recording

**Fails if:** it hangs, returns nothing on obvious content, or misattributes what
was said or shown.

**Docs:** [Extract structured data](https://seal-shot.com/docs/guide/ai/#extract-structured-data) · [OCR and Live Text](https://seal-shot.com/docs/guide/ai/#ocr-live-text)

### Sensitive content

#### Redact, Export and Attack

1. Capture real-looking credentials, numbers, and names
2. Redact them, then export or share
3. Attack your own export: zoom, adjust levels, run OCR, open it in another
   editor

**Fails if:** anything is recoverable by any means. Removed content must be
destroyed, not covered — the worst bug the app can have. File it immediately.

**Docs:** [Running a scan](https://seal-shot.com/docs/guide/redaction/#running-a-scan) · [Reviewing and applying](https://seal-shot.com/docs/guide/redaction/#reviewing-and-applying) · [Plain exports](https://seal-shot.com/docs/guide/sharing/#plain-exports)

#### Work with Encryption On

1. Turn on Enhanced Security
2. Capture, search, close, reopen, unlock — repeat across a day
3. Inspect the files on disk while locked

**Fails if:** search or thumbnails degrade, content readable while locked or on
disk, or prompts at odd moments. Encryption should cost one unlock, not
features.

**Docs:** [What it protects](https://seal-shot.com/docs/guide/security/#what-it-protects) · [Locking](https://seal-shot.com/docs/guide/security/#locking)

#### Lose the Code and Recover

1. Make yourself unable to unlock
2. Follow only what the lock screen offers
3. Get back to work — then restore when the recovery code turns up

**Fails if:** a dead end, a data-losing "reset", or restored captures that
differ from what was archived.

**Docs:** [Save your recovery code](https://seal-shot.com/docs/guide/security/#save-your-recovery-code) · [If you lose it](https://seal-shot.com/docs/faq/#what-if-i-lose-my-recovery-key)

#### Share with One Recipient

1. Share so that only the intended person can open it
2. Open it as that recipient, on another Mac
3. Try again as the wrong recipient

**Fails if:** it opens without its secret, a wrong passcode crashes or half-opens
it, or the recipient needs the sender's Mac.

**Docs:** [Export to package](https://seal-shot.com/docs/guide/sharing/#export-to-package) · [Opening a package](https://seal-shot.com/docs/guide/sharing/#opening-a-package) · [The .seal format](https://seal-shot.com/docs/guide/seal-format/)

### Organize & find

#### Build a Library and Search It

1. Accumulate a few dozen captures across days, or import a pile
2. Organize as much or as little as you would in real life
3. Find one by a word that was in it, roughly when, or what kind of thing it was

**Fails if:** a capture you can see but not find, search missing text plainly
visible in the image, or organization lost on relaunch.

**Docs:** [Search](https://seal-shot.com/docs/guide/library/#search) · [Collections and favorites](https://seal-shot.com/docs/guide/library/#collections-and-favorites)

#### Delete and Recover

1. Delete something wrongly, then recover it
2. Delete something deliberately, then confirm it is gone from search and disk
3. Let the trash purge on its timer, if you can wait

**Fails if:** unrecoverable accidents, "deleted" content still surfacing, or the
purge taking more than it should.

**Docs:** [Delete, restore and undo](https://seal-shot.com/docs/guide/library/#delete-restore-and-undo)

### Money & access

#### Run the Trial to Expiry

1. Start at first launch — permissions, onboarding, all of it
2. Note what the app tells you about time remaining
3. Reach day 14 and check what expiry does

**Fails if:** it never ends, ends early, or locks you out of your own library.
Only new captures should pause.

**Docs:** [How the trial works](https://seal-shot.com/docs/faq/#how-does-the-free-trial-work)

#### Buy, Activate and Roam

1. Purchase and receive the license
2. Activate with the network off — activation claims to be offline
3. Activate on a second Mac, then run a build the license doesn't cover and
   renew your way out

**Fails if:** activation needs the internet, the second Mac refuses a valid
license, or an uncovered version blocks existing work.

**Docs:** [Activating a license](https://seal-shot.com/docs/faq/#how-do-i-activate-my-license-do-i-need-an-account-or-internet) · [Moving to a new Mac](https://seal-shot.com/docs/faq/#i-got-a-new-mac--how-do-i-move-my-license) · [License settings](https://seal-shot.com/docs/guide/settings/#license)

### Trust & longevity

#### Reopen and Re-edit Old Work

1. Open a capture from weeks ago, ideally on an app version newer than the one
   that made it
2. Move, delete, and restyle marks that are already on it
3. Strip back to the original pixels

**Fails if:** flattened annotations, edits that no longer undo, or a file the
newer version won't open.

**Docs:** [Annotation tools](https://seal-shot.com/docs/guide/editor/#annotation-tools) · [Move, resize, rotate, flip](https://seal-shot.com/docs/guide/editor/#move-resize-rotate-flip)

#### Update in Place

1. Start on a previous release with real data in place
2. Let the built-in updater move you forward
3. Check the library, settings, license, and undo history

**Fails if:** anything you must set up again — above all, a capture that doesn't
survive.

**Docs:** [How updates work](https://seal-shot.com/docs/faq/#how-do-i-update-sealshot)

#### Monitor the Network

1. Start a monitor (Little Snitch, Proxyman, or `tcpdump`)
2. Run a full mix of the scenarios above, AI features especially
3. Compare every request against the list below

Exactly three requests are allowed, and all three are downloads:

1. the daily update check
2. the revoked-license list, fetched on launch
3. the redaction model, only if you approved it

Requests 1 and 2 follow **Automatically check for updates**, so turning it off
must stop both.

**Fails if:** one packet of anything else, or an allowed request carrying a
license ID, identifier, or capture content — nothing identifying should leave the
Mac, so contents matter as much as destinations. Record destination and trigger;
outranks every bug except Redact, Export and Attack.

**Docs:** [Privacy policy](https://seal-shot.com/privacy/) · [What leaves your Mac](https://seal-shot.com/docs/faq/#does-sealshot-send-my-screenshots-anywhere)

### Environment

#### Repeat in Harsher Environments

1. Re-run the Everyday capture scenarios on more than one display, a scaled or
   notched screen, and an Intel Mac
2. Add a crowded menu bar, a non-default save location, a second display asleep
3. Check that features needing newer hardware say so rather than fail silently

**Fails if:** captures from the wrong display or scale, overlays on the wrong
screen, or Intel hitting mystery failures instead of "not on this Mac".

**Docs:** [Intel Macs](https://seal-shot.com/docs/faq/#does-sealshot-work-on-intel-macs) · [Which Macs run what](https://seal-shot.com/docs/guide/ai/#which-macs-run-what)

---

## 4. Report an issue

[to be added]

## 5. Follow-up

- I will follow up with you separately to gather more information
