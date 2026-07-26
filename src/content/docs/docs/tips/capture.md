---
title: "Tips: Capture"
description: Get exactly the right pixels on the first try — selection tricks, frozen screens, and the modes people forget.
---

Most cleanup later is caused by a rushed capture. These are the ways to get
it right the first time.

## Selection

- **Scroll to resize your selection — either way.** In the
  [unified overlay](/docs/guide/capture/#smart-capture-area--window), hover
  and scroll the wheel to step the highlight outward through the regions
  under your pointer, ending at the whole window. Scroll back and it steps
  inward again, so overshooting costs you nothing.
- **Detection works at app scale, not button scale.** Boundary detection
  offers regions roughly the size of a dialog or larger and deliberately
  skips buttons, cards, toolbars, and sidebars. In a browser that usually
  means two stops — the page content, then the window. **Drag** for anything
  smaller; scrolling won't get you there.
- **You don't have to drag.** Click once to set a corner, move, and click
  again. Either way, **adjustable handles** let you nudge the edges before
  you confirm, so a selection that's two pixels off doesn't mean starting
  over.
- **Esc gets you out of anything** — the overlay, a delayed countdown, or a
  scrolling capture mid-stitch.

## Catching things that won't hold still

- **Freeze the screen to catch menus.**
  [Delayed capture](/docs/guide/capture/#delayed) (**⌘⇧D**) freezes
  everything after a countdown, so open dropdowns and hover states survive
  long enough to capture.
- **Pick your countdown.** That delay is 3, 5, 10, or 15 seconds from the
  delay selector — not just the default 3. Ten is about right for a
  three-level menu.
- **Grab every display at once.** In the
  [fullscreen picker](/docs/guide/capture/#fullscreen) (**⌘⇧F**),
  ⌘-click stitches all your monitors into one image.

## Tall pages

- **When auto-scroll can't drive the app, do it yourself.**
  [Scrolling capture](/docs/guide/capture/#scrolling-capture) (**⌘⇧W**)
  normally scrolls for you, given Accessibility permission — but it also
  has a manual mode where you scroll and press **Return** to finish. Worth
  knowing before you conclude a stubborn app can't be captured.

## Live Capture

- **It rescues the window that was buried.**
  [Live Capture](/docs/guide/capture/#live-capture) (**⌘⇧X**) grabs every
  on-screen window as its own layer, each one **captured in full** even
  where another window was covering it. Take the scene, then raise the
  window you actually needed.
- **It's your current Space only.** Minimized windows and windows on other
  desktops aren't included — so bring what you need into view first.

## Two modes people forget

- **⌘⇧S for a one-off file.**
  [Save as…](/docs/guide/capture/#save-as) writes a capture straight to a
  folder you pick, without adding it to your library or touching the
  clipboard. Right for the screenshot you'll never want again.
- **Skip the editor entirely.** Set the default destination to
  **Clipboard** in [Settings → Capture](/docs/guide/settings/#capture) and
  captures go straight to your clipboard to paste — no editor, no file.

## Recording

- **⌘⇧V follows your pointer.** With several displays,
  [Record screen](/docs/guide/recording/#starting-a-recording) records the
  one your pointer is on, so put the cursor where you mean before you press
  it.
- **Pause from the keyboard.** **⌘⇧P** keeps the trip to the
  [HUD](/docs/guide/recording/#while-recording) out of your recording while
  you set up the next step.
- **Turn the Record prompt off once you know your settings.** *Ask before
  each recording* lives in that prompt — handy at first, friction later.
