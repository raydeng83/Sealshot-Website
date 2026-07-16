---
title: Screen recording
description: Record your screen, a window, or a region — with system audio and microphone.
---

Sealshot records video as well as stills: the full screen, a window, or a
region you draw, with system audio and your microphone if you want them.
Recordings land in the same [Library](/docs/guide/library/) as your
screenshots, protected by the same
[Enhanced Security](/docs/guide/security/) encryption.

## Starting a recording

- **Record screen** (**⌘⇧V**, or the menu bar) — records the display under
  your pointer. With more than one display, a monitor picker opens so you can
  click the screen to record.
- **Record selection** (**⌘⇧R**, or the menu bar) — opens the capture
  overlay: drag a region, or hover a window and click to record just that
  window.

By default Sealshot shows a short **Record** prompt first, where you can flip
system audio, microphone, cursor visibility, and the countdown for just this
recording (turn the prompt off there too, with **Ask before each recording**).
A **3-second countdown** (configurable: off, 3, 5, or 10 seconds) gives you a
moment to set the stage.

![The Record prompt](/manual/record-prompt.png)
*Confirm audio and countdown options, then start.*

## While recording

A small **floating HUD** shows a red dot and the elapsed time. Hover to
reveal **Pause** and **Stop**; drag the dot to move it out of the way. You
can also pause and resume from the keyboard (**⌘⇧P**) — handy because it
keeps the mouse out of your recording — or control everything from the menu
bar.

![The recording HUD](/manual/recording-hud.png)
*The HUD: elapsed time, pause, and stop. Drag it anywhere.*

## Audio

Two independent sources, both set in **Settings → Recording**:

- **Capture system audio** (on by default) — what your Mac is playing.
- **Capture microphone** (off by default) — your voice. The first time you
  turn it on, macOS asks for Microphone permission.

**Reduce microphone noise** (on by default) suppresses background noise and
levels your voice — processed on your Mac, like everything else.

## Quality and format

In **Settings → Recording**, choose the codec — **HEVC (.mov)** (default) or
**H.264 (.mp4)** — and the frame rate (**30** or **60** fps). **Show cursor**
controls whether the pointer appears in the recording.

## Where recordings go

Recordings are saved as **video `.seal` packages** in the same folder as
your captures, appear in the Library and recent strip with thumbnails, and
play right in the editor. With Enhanced Security on, recordings are
encrypted at rest like everything else.

When you need a regular video file, use **File → Export to Video…** to write
a `.mov`/`.mp4` — for one recording or a whole selection at once. See
[Sharing & export](/docs/guide/sharing/).
