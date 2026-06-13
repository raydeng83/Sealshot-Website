# Screenshot shot list

The manual references images at `/manual/<name>.png` (this folder,
`public/manual/`). Capture each shot below at **2× (Retina)**, PNG, and drop
it in with the exact filename. Until a file exists the page shows a broken
image — the build still succeeds.

Tips for consistent shots:
- Use a clean demo capture with **no real personal data** (the redaction
  shots should use obviously-fake emails / card numbers / keys).
- Light mode, default window size, hide unrelated desktop clutter.
- Crop tightly to the relevant UI; leave a little breathing room.

## Getting started (`getting-started.md`)
- `install-drag.png` — the opened .dmg with Sealshot being dragged onto the Applications alias.
- `permission-screen-recording.png` — macOS System Settings → Privacy & Security → Screen Recording with Sealshot toggled on.
- `menu-bar.png` — the Sealshot menu-bar icon with its menu open (capture commands visible).

## Capture modes (`capture.md`)
- `capture-area.png` — the area-selection overlay mid-drag with the dimmed surround and selection handles.
- `capture-window.png` — window capture with a window highlighted by boundary detection.
- `capture-delayed.png` — the on-screen delayed-capture countdown.
- `capture-element.png` — freeze-frame element selection highlighting one UI element.
- `capture-scrolling.png` — scrolling capture in progress (the coach card / progress), or the stitched result.
- `capture-destination.png` — Settings → General → Capture Defaults showing the Clipboard/File/Both picker.

## The editor (`editor.md`)
- `editor-overview.png` — a capture open in the editor: toolbar, canvas, side panels, strip.
- `editor-toolbar.png` — close-up of the annotation toolbar with tools labeled.
- `blur-panel.png` — the blur tool selected, showing brush-width + Gaussian/Solid controls and the strength slider.
- `focus-crop.png` — the focus/crop viewfinder brackets over an image.
- `transform-handles.png` — a selected object showing rotate handle + resize handles.
- `ocr-live-text.png` — text being selected (highlighted) inside a screenshot.

## Smart Redaction (`redaction.md`)
- `redaction-review.png` — the Smart Redaction panel listing detected items (category, masked snippet, confidence) with checkboxes and Apply/Cancel.
- `redaction-setting.png` — Settings → General → Smart Redaction toggle.

## Library & search (`library.md`)
- `library-grid.png` — the Library in grid view with several captures.
- `library-strip.png` — the editor's recent-captures strip along the bottom.
- `library-search.png` — a search query matching text *inside* a capture (OCR), results shown.
- `library-marquee.png` — a rubber-band selection rectangle drawn across several grid cards.
- `library-info-pane.png` — the left Info pane showing a capture's metadata + object summary.
- `library-deleted.png` — the Deleted (trash) section with Restore available.

## Enhanced Security (`security.md`)
- `security-setting.png` — Settings → Privacy & Security with Enhanced security toggled on.
- `security-recovery-key.png` — the recovery-key ceremony sheet.
- `lock-screen.png` — the lock screen prompting for Touch ID / password.

## Settings (`settings.md`)
- `settings-general.png` — Settings → General (full page).
- `settings-shortcuts.png` — Settings → Shortcuts with recorders.
- `settings-permissions.png` — Settings → Permissions status list.
