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
- `install-drag.png` — the opened .dmg with Sealshot being dragged onto the Applications alias. ✓ have
- `permission-screen-recording.png` — macOS System Settings → Privacy & Security → Screen Recording with Sealshot toggled on. ✓ have
- `menu-bar.png` — the Sealshot menu-bar icon with its menu open (capture + recording commands with inline shortcuts). ⟳ retake for 0.7.0 (menu was rebuilt)

## Capture modes (`capture.md`)
- `capture-area.png` — the unified overlay mid-drag with the dimmed surround and selection handles. ✓ have
- `capture-window.png` — the unified overlay with an element/window highlighted by boundary detection. ⟳ retake if the old shot shows the pre-0.7.0 overlay
- `capture-delayed.png` — the on-screen delayed-capture countdown. ✓ have
- `capture-scrolling.png` — scrolling capture in progress, or the stitched result. ✓ have
- `capture-destination.png` — Settings → Capture → Capture Defaults showing the Clipboard/File/Both picker. ⟳ retake (setting moved to the Capture tab)
- ~~`capture-element.png`~~ — no longer referenced (element selection folded into unified capture).

## Screen recording (`recording.md`) — NEW
- `record-prompt.png` — the Record prompt with system audio / microphone / cursor / countdown options.
- `recording-hud.png` — the floating recording HUD, hovered so Pause/Stop are visible.

## The editor (`editor.md`)
- `editor-overview.png` — a capture open in the editor: toolbar, canvas, right Info panel, strip. ⟳ retake (Info panel moved right in 0.7.0)
- `editor-toolbar.png` — close-up of the annotation toolbar with tools labeled.
- `blur-panel.png` — the blur tool selected, showing brush-width + Gaussian/Solid controls and the strength slider.
- `focus-crop.png` — the focus/crop viewfinder brackets over an image.
- `transform-handles.png` — a selected object showing rotate handle + resize handles.
- `ocr-live-text.png` — text being selected (highlighted) inside a screenshot; bonus: a QR code detected.

## Smart Redaction (`redaction.md`)
- `redaction-review.png` — the review panel: flagged text leading each row, high-risk items pre-checked, Select all/Deselect all visible. ⟳ retake for 0.7.0 (panel redesigned)
- `redaction-setting.png` — Settings → On-Device AI → Smart Redaction card (auto-scan, enhanced model row, Thorough scan). ⟳ retake (moved from General)

## On-device AI (`ai.md`) — NEW
- `extract-data.png` — the Extract Structured Data window on a capture containing a table, CSV or Table tab active.

## Library & search (`library.md`)
- `library-grid.png` — the Library in grid view: sidebar with All Files / Recents / Collections (Favorites) / Trash visible. ⟳ retake (sidebar changed in 0.7.0)
- `library-strip.png` — the editor's recent-captures strip along the bottom (include a video with its play badge).
- `library-search.png` — a search query matching text *inside* a capture (OCR), results shown.
- `library-marquee.png` — a rubber-band selection rectangle drawn across several grid cards.
- `library-info-pane.png` — the Info panel showing name, summary, Smart Keywords, and tags. ⟳ retake (panel redesigned)
- `library-deleted.png` — the Trash section with Restore available.

## Sharing & export (`sharing.md`) — NEW
- `export-package.png` — the Export to Package dialog: format choice, passcode with Copy/Regenerate, expiry.

## Enhanced Security (`security.md`)
- `security-setting.png` — Settings → Privacy & Security with Enhanced security toggled on (recovery code + auto-lock rows visible).
- `security-recovery-key.png` — the recovery-code ceremony sheet.
- `lock-screen.png` — the lock screen prompting for Touch ID / password.

## Settings (`settings.md`)
- `settings-general.png` — Settings → General (full page). ⟳ retake for 0.7.0 (tabs reorganized)
- `settings-shortcuts.png` — Settings → Shortcuts with the Capture / Recording / App cards. ⟳ retake (recording shortcuts added)
- `settings-permissions.png` — Settings → Permissions status list (Screen Recording, Microphone, Accessibility).
