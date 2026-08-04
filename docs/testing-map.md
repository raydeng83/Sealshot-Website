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
*~10 min · workbooks 02, 04, 10*

#### Scroll Capture and Verify

1. Capture a page, thread, or document longer than the screen
2. Inspect at 100% zoom, not thumbnail size
3. Check the seams, repeated bands, and the tail

**Fails if:** stitch lines, duplicated or skipped content, or a capture that
stopped early.
*~10 min · workbook 03*

#### Capture Straight to File

1. Capture with the fewest steps the app allows — no editor
2. Find the file on disk
3. Open it in another app

**Fails if:** UI you didn't ask for, a file in the wrong place, or one other apps
can't open.
*~5 min · workbooks 01, 02*

### Recording

#### Record with Narration, Pause and Resume

1. Record part of the screen with mic audio
2. Pause halfway, switch apps, resume
3. Play the result on another machine

**Fails if:** missing or desynced audio, the pause eating content, or a file
QuickTime won't play.
*~15 min · workbook 08*

#### Extract from a Recording

1. Open a finished recording
2. Pull out something other than the video — text, moments, a summary
3. Check it against what is actually in the recording

**Fails if:** it hangs, returns nothing on obvious content, or misattributes what
was said or shown.
*~10 min · workbooks 08, 11*

### Sensitive content

#### Redact, Export and Attack

1. Capture real-looking credentials, numbers, and names
2. Redact them, then export or share
3. Attack your own export: zoom, adjust levels, run OCR, open it in another
   editor

**Fails if:** anything is recoverable by any means. Removed content must be
destroyed, not covered — the worst bug the app can have. File it immediately.
*~15 min · workbooks 05, 09, 10*

#### Work with Encryption On

1. Turn on Enhanced Security
2. Capture, search, close, reopen, unlock — repeat across a day
3. Inspect the files on disk while locked

**Fails if:** search or thumbnails degrade, content readable while locked or on
disk, or prompts at odd moments. Encryption should cost one unlock, not
features.
*~20 min spread across a day · workbook 09*

#### Lose the Code and Recover

1. Make yourself unable to unlock
2. Follow only what the lock screen offers
3. Get back to work — then restore when the recovery code turns up

**Fails if:** a dead end, a data-losing "reset", or restored captures that
differ from what was archived.
*~20 min · workbook 09*

#### Share with One Recipient

1. Share so that only the intended person can open it
2. Open it as that recipient, on another Mac
3. Try again as the wrong recipient

**Fails if:** it opens without its secret, a wrong passcode crashes or half-opens
it, or the recipient needs the sender's Mac.
*~15 min, needs a second Mac · workbook 10*

### Organize & find

#### Build a Library and Search It

1. Accumulate a few dozen captures across days, or import a pile
2. Organize as much or as little as you would in real life
3. Find one by a word that was in it, roughly when, or what kind of thing it was

**Fails if:** a capture you can see but not find, search missing text plainly
visible in the image, or organization lost on relaunch.
*~15 min on an existing library · workbooks 06, 07*

#### Delete and Recover

1. Delete something wrongly, then recover it
2. Delete something deliberately, then confirm it is gone from search and disk
3. Let the trash purge on its timer, if you can wait

**Fails if:** unrecoverable accidents, "deleted" content still surfacing, or the
purge taking more than it should.
*~10 min · workbook 06*

### Money & access

#### Run the Trial to Expiry

1. Start at first launch — permissions, onboarding, all of it
2. Note what the app tells you about time remaining
3. Reach day 14 and check what expiry does

**Fails if:** it never ends, ends early, or locks you out of your own library.
Only new captures should pause.
*Minutes a day across the window, or clock-shift · workbooks 00, 14*

#### Buy, Activate and Roam

1. Purchase and receive the license
2. Activate with the network off — activation claims to be offline
3. Activate on a second Mac, then run a build the license doesn't cover and
   renew your way out

**Fails if:** activation needs the internet, the second Mac refuses a valid
license, or an uncovered version blocks existing work.
*~30 min, needs a second Mac · workbooks 14, 15*

### Trust & longevity

#### Reopen and Re-edit Old Work

1. Open a capture from weeks ago, ideally on an app version newer than the one
   that made it
2. Move, delete, and restyle marks that are already on it
3. Strip back to the original pixels

**Fails if:** flattened annotations, edits that no longer undo, or a file the
newer version won't open.
*~10 min, needs an aged library · workbooks 04, 12*

#### Update in Place

1. Start on a previous release with real data in place
2. Let the built-in updater move you forward
3. Check the library, settings, license, and undo history

**Fails if:** anything you must set up again — above all, a capture that doesn't
survive.
*~15 min · workbook 12*

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
*Passive, alongside other scenarios · workbooks 12, 13*

### Environment

#### Repeat in Harsher Environments

1. Re-run the Everyday capture scenarios on more than one display, a scaled or
   notched screen, and an Intel Mac
2. Add a crowded menu bar, a non-default save location, a second display asleep
3. Check that features needing newer hardware say so rather than fail silently

**Fails if:** captures from the wrong display or scale, overlays on the wrong
screen, or Intel hitting mystery failures instead of "not on this Mac".
*~20 min per environment · workbooks 00, 02, 03, 13*

---

## 4. Report an issue

[to be added]

## 5. Follow-up

- I will follow up with you separately to gather more information
