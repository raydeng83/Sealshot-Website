# Sealshot — internal testing manual

For the small group testing Sealshot before the 1.0 release.

**This is not a list of test cases.** There are 16 detailed case workbooks in
`testing/test cases v4/` and running them all is not the goal. This manual
exists to answer three questions: what is this app, what should you spend your
time on, and what route should you take through it. Where you want the fine
detail, each section points at the workbook that has it.

Read §1 and §2, then work through §4 in order. Budget two to three hours for a
first pass.

---

## 1. What Sealshot is

A screenshot and screen-recording app for macOS 14 and later that does
everything on the machine it runs on. Capture, OCR, redaction, AI features and
search are all local. There is no account, no sync, and no telemetry.

That last point matters more for testing than it sounds — see §3.

### How it is put together

**A menu-bar launcher.** Capture is started from the menu bar icon or a
keyboard shortcut, not from a window. The icon can be pushed off-screen by
other menu-bar items on a narrow display; if you cannot see it, that is a
crowded menu bar, not a missing app.

**One window with three tabs.**

![The Editor tab — canvas, tool rail, and the recent strip along the bottom.](/manual/editor-overview.jpg)

![The Library tab — grid, sidebar, and search.](/manual/library-grid.jpg)

| Tab | What it is for |
|---|---|
| **Editor** | The canvas. Annotate, crop, redact, and run the AI tools on one capture. Also holds the recent strip. |
| **Library** | Everything you have captured. Search, tags, collections, trash, and the info pane. |
| **Settings** | Nine sections: General, Capture, Recording, On-Device AI, Shortcuts, Permissions, **License**, Privacy & Security, About. |

![The menu-bar launcher, where every capture starts.](/manual/menu-bar.png)

**Seven ways to capture:**

| Mode | Shortcut |
|---|---|
| Smart Capture — area or window in one overlay | `⌘⇧C` |
| Fullscreen | `⌘⇧F` |
| Delayed | `⌘⇧D` |
| Scrolling — stitches a long page | `⌘⇧W` |
| Live Capture — layered desktop scene | `⌘⇧X` |
| Save as… — straight to a file | `⌘⇧S` |
| Record screen / selection | `⌘⇧V` / `⌘⇧R` |

**One build.** Sealshot ships only as a signed, notarised direct download,
unlocked by a licence file and updating itself from a public version feed. There
is no Mac App Store edition, so no feature is missing from what you are testing
and every licensing behaviour in §4.7 applies.

---

## 2. Where to spend your time

Ranked by what it costs us if it is broken, not by how much code there is.

### Tier 1 — a failure here is unrecoverable or reputational

| Focus | Why it leads | Workbook |
|---|---|---|
| **Capture correctness** | It is the product. A capture that is the wrong region, the wrong scale, or the wrong display makes everything downstream pointless. | 02, 03 |
| **Redaction is permanent** | The claim is that redacted content is *destroyed*, not covered. If an exported file still contains what was redacted underneath, that is the worst bug this app can have. | 09 |
| **Encryption and lock** | Wrong key handling loses a user's library permanently. There is no server-side copy to restore from. | 09 |
| **Nothing leaves the device** | The core promise. One unexpected outbound request undoes the product's whole positioning. | 12, 13 |

### Tier 2 — money, access, and the newest code

| Focus | Why it leads | Workbook |
|---|---|---|
| **Licensing and trial** | Rewritten this week. Activation, the anti-downgrade rule, the expiry banner, and what the app does when the update window closes. | 14 |
| **Purchase and delivery** | A failure means someone paid and got nothing. | 15 |
| **First run and permissions** | Gates every other feature, and can only be seen once per machine — see §3. | 00 |

### Tier 3 — largest surface, most bugs by volume, individually recoverable

| Focus | Workbook |
|---|---|
| **Editor canvas and tools** — 51,500 lines, by far the biggest module | 04 |
| **Library, search, metadata, OCR, smart tags** | 06, 07 |
| **On-device AI** — Live Text, Find in Image, Enhance, Remove Background | 05, 13 |

### Tier 4 — narrower, or well-bounded

Recording (08), sharing and export (10), structured data extraction (11),
updates (12), menu bar, shortcuts and settings (01).

### Priority is not the same as time

Tier 3 will consume the most of your hours simply because the Editor is where
most of the code and most of the interactions are. That is fine and expected.
The ranking says which findings to write up first and which to chase hardest —
not where the clock goes.

---

## 3. Four things that will quietly waste your testing

Read these before you start. Each one has caused a whole session to prove
nothing.

### There is no telemetry, so nothing is recorded unless you write it down

Most apps backfill what testers forget, from usage data. This one cannot: it
collects nothing, on purpose. If you notice something and do not write it down,
it is gone.

So finish every session with three lines, even when nothing broke:

- what you tried
- what surprised you
- what you gave up on, and why

The third is the most valuable and the least often reported. Something you
abandoned because it was confusing is a finding, not a failure on your part.

### Some builds cannot show you licence expiry at all

A release build is stamped with the date it shipped, and licensing compares
that date against your licence's window. **Development builds carry no stamp,
so every licence check passes.** On a dev build you will not see the trial end,
the 30-day expiry banner, or a release being refused as outside your
window — and the app will look perfectly healthy while you test none of it.

![Settings ▸ General. The build number sits under Updates, bottom right.](/manual/settings-general.jpg)

The build is shown in **Settings ▸ General** under Updates, and again in
**Settings ▸ About**. If you are doing anything in Tier 2, use the notarised
build.

### Permission prompts happen once

Screen Recording, Accessibility and Microphone are granted once and then never
asked again. The first-run experience is therefore a **one-shot test**, and it
is the first thing a new user meets.

Do the §4.1 pass before granting anything else. To get a second run:

```
tccutil reset ScreenCapture com.seal-shot.sealshot.direct
tccutil reset Accessibility  com.seal-shot.sealshot.direct
tccutil reset Microphone     com.seal-shot.sealshot.direct
```

Then relaunch. A fresh macOS user account also works and is safer if you would
rather not reset your own permissions.

### Licence states cannot be reached by waiting

The trial is 14 days and an update window is 12 to 18 months. Nobody tests
expiry by waiting for it. Ask for the **licence fixture set** — files minted
with specific dates and properties, covering an already-expired window, one
expiring in about 20 days, a 25-seat volume licence, an older file for the same
licence, a tampered file, and a revoked one. Testing Tier 2 without these
means testing only the happy path.

---

## 4. The route

Eight sessions, in this order. The ordering matters in two places: §4.1 must
come first because permissions are one-shot, and §4.5 before §4.6 because you
need a library worth exporting.

Each session gives you the goal, a path, and **the thing most likely to be
wrong** — the specific failure I would look for if I only had five minutes.

### 4.1 First run — before you grant anything

**Goal:** see what a brand-new user sees.

Install, launch, and go through onboarding without skipping ahead. Decline a
permission on purpose and see what the app does about it. Then grant it and
confirm the app notices without needing a restart. Find the menu-bar icon.
Trigger your first capture from the menu, not a shortcut.

![Settings ▸ Permissions. Each row should turn Granted without a relaunch.](/manual/settings-permissions.jpg)

**Most likely wrong:** a permission granted while the app is running is not
picked up until relaunch, or a declined permission leaves a feature that looks
available but silently does nothing.

### 4.2 Capture, all seven ways

**Goal:** confirm you get exactly the pixels you asked for.

Take each mode in turn. For Smart Capture, try both the area drag and the
window hover in the same overlay. For scrolling, use a long web page *and*
something that is not a web page — a Terminal buffer, a long list. Then repeat
your two favourite modes on a **second display with different scaling** to the
first.

![Smart Capture mid-drag: dimmed surround, selection handles, live size and the magnifier loupe.](/manual/capture-area.jpg)

![Window mode in the same overlay — hover highlights a whole window.](/manual/capture-window.jpg)

![Scrolling capture stitching a long page.](/manual/capture-scrolling.jpg)

**Most likely wrong:** mixed Retina and non-Retina displays. Wrong scale factor,
an off-by-one region, or the capture landing from the wrong screen. This is
where screenshot apps break, and it will not show up on a single-display Mac.

### 4.3 Editor

**Goal:** make a real annotated screenshot, the way you would for actual work.

Crop, set a focus area, annotate with several tools, undo and redo past a
save, zoom, and use Find in Image. Do not follow a checklist — try to produce
something you would genuinely send to someone.

![The editor toolbar. Tool order here is the reference — report anything that differs.](/manual/editor-toolbar.png)

![Focus brackets and the Crop tool are separate features; do not conflate them.](/manual/focus-crop.jpg)

**Most likely wrong:** undo/redo across an operation that changes the canvas
size, such as crop. Also focus brackets versus the crop tool: they are
different features and easy to conflate.

### 4.4 Redaction — the one to be suspicious about

**Goal:** prove that redacted content is gone, not hidden.

Redact something identifiable. Export the result. Then **attack your own
export**: open it in another editor and try to recover what was underneath.
Zoom hard. Adjust levels and contrast. If the redaction was drawn as an overlay
rather than destroying pixels, this is where it shows.

![The redaction review pane — detected regions before they are applied.](/manual/redaction-review.png)

Do the same for a `.seal` package, which keeps layers — confirm the redaction
is not merely a removable layer in the exported copy.

**Most likely wrong:** the exported flat image is fine but the layered package
retains the original underneath, so sharing the package leaks what sharing the
PNG does not.

### 4.5 Library, security and lock

**Goal:** trust it with your captures.

Build up twenty or so captures. Search by text inside them, by tag, by date.
Use collections. Delete something and get it back from trash. Then enable
enhanced security, lock with `⌘⇧L`, unlock, and quit and relaunch while locked.

![Privacy & Security. Every prompt on this pane is load-bearing.](/manual/security-setting.jpg)

![The recovery key — the only way back into an encrypted library.](/manual/security-recovery-key.png)

![The lock screen, after ⌘⇧L.](/manual/lock-screen.png)

**Most likely wrong:** anything involving the recovery code or key replacement.
Get this wrong and a user's library is unrecoverable, so treat every prompt in
Privacy & Security as load-bearing and read it carefully before clicking.

### 4.6 Sharing and export

**Goal:** get things out of the app intact.

Export to each format. Share a `.seal` package and open it somewhere else.
Check what metadata travels with an export and what is stripped.

![Exporting a .seal package — check what travels with it.](/manual/export-package.png)

**Most likely wrong:** metadata leaking into a shared file — OCR text, tags, or
a file path that reveals something about the machine.

### 4.7 Licensing and purchase — notarised build only

**Goal:** behave correctly at every licence state.

Everything here lives in **Settings ▸ License**.

With the fixture set: activate a valid licence and confirm the details shown
match the file. Activate an **older** file for the same licence and confirm it
is refused rather than shortening your window. Try the tampered file and the
revoked one. Load the one expiring in 20 days and confirm the banner appears
and the Renew button opens the right page with your licence ID in the URL.
Finally, run a sandbox purchase end to end and activate what arrives by email.

**Most likely wrong:** the anti-downgrade rule. It is new, and the failure is
silent — a paid update window quietly getting shorter with no error shown.

### 4.8 Updates and recovery

**Goal:** confirm the app can move forward and survive going wrong.

Check for updates. Force-quit mid-capture and mid-recording, then relaunch and
see what state you are in. Fill the disk, or point the save location at a
volume you then eject.

**Most likely wrong:** an interrupted recording leaving an unplayable file, or
a capture lost with no indication it was lost.

---

## 5. Reporting

### One finding per report

**Title** — one line, what is wrong, not what you were doing.
**Build** — version and build number from Settings ▸ About, and whether it is
the notarised or a development build.
**Machine** — Apple Silicon or Intel, macOS version, and display setup if the
finding could involve screens.
**Steps** — numbered, from launch, in a form someone else can follow.
**Expected / actual** — both, even when the difference seems obvious.

### Attachments — and what not to attach

This app's subject matter is your screen, so a natural repro will often contain
your real work. **Reproduce with throwaway content before attaching anything.**
If you cannot, describe it instead — we would rather have a vaguer report than
your private data.

For crashes, follow `docs/product/tester-crash-logs.md`. Crash reports contain
no captured content, and you are welcome to read one before sending it.

### Severity

| | Meaning |
|---|---|
| **S1** | Data loss, or anything leaving the device. A stray network request is S1 even if nothing visibly breaks. |
| **S2** | A paying user cannot activate, capture, or recover their work. |
| **S3** | A feature is broken but there is a workaround. |
| **S4** | Polish, wording, layout. |

S1 and S2 stop your session — tell us straight away rather than continuing.

### Not bugs right now

Do not report these; they are known states of the pre-release setup.

- Checkout showing sandbox prices, or a test card being required
- Licence emails only arriving at one specific inbox
- A macOS warning that the app is from an unidentified developer, on a
  development build
- Every licence check passing on a development build — see §3
- Pages on the website asking you to sign in

---

## 6. If you only have an hour

1. §4.1 on a machine that has never run Sealshot
2. §4.2 with two displays at different scaling
3. §4.4, including the attack on your own export
4. §4.7 with the expired and older-file fixtures

That is the four places where a bug would be expensive rather than annoying.
