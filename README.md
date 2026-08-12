# Marriage Invitation Website

A cinematic digital wedding invitation. The visitor first scrolls through a
scroll-driven film — **Mehndi → Barat → Walima → the couple on the sofa** —
rendered from the supplied frame sequence through a WebGL pipeline. Only when
the film ends does the invitation itself begin.

---

## Quick start

```bash
npm install
npm run frames     # one-off: turns the source PNGs into optimised web assets
npm run dev
```

`npm run build` produces `dist/`, which is a plain static site — it can be
dropped on Netlify, Vercel, Cloudflare Pages, GitHub Pages or any static host.

---

## Editing the wedding details

**Everything a guest reads lives in [`src/config/wedding.config.js`](src/config/wedding.config.js).**
Names, the countdown date, all three events, the venue, the map queries, the
RSVP settings and the family phone numbers. No component hardcodes any of it.

> The values shipped in that file are **placeholders** — replace them with the
> real details before sending the link to anyone.

The RSVP form works without a backend: it validates, stores the reply locally
and hands off to WhatsApp or email using the numbers in the config. If you would
rather collect replies centrally, set `rsvp.endpoint` to a form endpoint
(Formspree, Getform, Basin, your own API) and the form will `POST` JSON to it as
well.

The film's pacing, grading and chapter titles live in
[`src/config/scenes.config.js`](src/config/scenes.config.js).

---

## The frame pipeline

`scripts/build-frames.mjs` reads `DESKTOP FRAMES/` and writes everything the
site serves. It is the only place the source PNGs are touched.

| | |
|---|---|
| Source | 300 PNG frames, 1280×720, 293 MB |
| Deduplicated | 240 unique frames — the render was exported at 30 fps from a 24 fps source, so every 5th frame was an exact duplicate |
| `public/frames/desktop` | 240 × WebP 1280×720 — **15.9 MB** |
| `public/frames/mobile` | 240 × WebP 854×480 — **9.3 MB** |
| `public/stills` | 8 gallery frames + 2 portrait crops |

It also writes `public/frames/manifest.json` (which maps the original frame
numbers onto output indices, so the scene config stays readable) and
`src/config/stills.generated.js`.

```bash
npm run frames             # full rebuild
npm run frames -- --stills # re-cut only the gallery and portrait images
```

> `DESKTOP FRAMES/` and `MOBILE FRAMES/` are **not in the repository** — 293 MB
> each, and only ever inputs to this script. Everything the site serves is
> committed under `public/`, so a fresh clone builds and deploys as-is. You only
> need the source PNGs back in place if you want to re-run the pipeline.

---

## How the film works

**Loading** — `FrameSequence` fetches a coarse pass first (a dense run of the
opening frames plus every 4th frame across the film) and only then hands over,
so the film can start before all 240 frames have landed. The rest fills in
behind the scenes, prioritised by distance from the playhead in the direction
of travel.

**Memory** — holding 240 decoded frames would cost ~885 MB of RGBA. Instead the
compressed bytes are kept for the whole session (~16 MB, so re-scrubbing is
instant) while decoded `ImageBitmap`s are limited to a window that follows the
playhead, plus a sparse set of anchors so a sudden jump always has something to
show. Everything else is closed and released.

**Rendering** — one full-screen shader pass per tick, driven by GSAP
ScrollTrigger through a frame-rate-independent smoothed playhead. A small LRU
texture pool keeps GPU uploads to one per *frame change* rather than one per
rendered tick. The pass does the grade, defocus, bloom, vignette, grain and the
blurred backdrop fill together; a drifting dust layer sits on top.

**Framing** — the plate is always drawn *contain*, so the whole 16:9 frame is on
screen and the couple can never be clipped by the viewport. The leftover area is
filled with a heavily blurred, darkened copy of the same frame, so there is
never a hard letterbox or an empty margin at any aspect ratio. The camera drift
budget is derived from the punch-in (`driftBudget`), which means it is exactly
zero while the frame is shown whole — the opening shot, where the groom and
bride enter at the extreme left and right edges, is guaranteed uncropped.

**Fallbacks** — no WebGL falls back to a Canvas2D renderer with the same
framing rules; `prefers-reduced-motion` disables the drift, dust and scrub
smoothing; and if the manifest cannot be loaded at all, the invitation is shown
without the film rather than failing.

---

## Structure

```
scripts/build-frames.mjs        asset pipeline (source PNGs -> WebP + manifest)
src/
  config/
    wedding.config.js           >>> all wedding content <<<
    scenes.config.js            story beats, grading, scroll pacing
    stills.generated.js         written by the pipeline
  lib/
    FrameSequence.js            streaming loader + bounded decode window
    CinematicRenderer.js        WebGL stage, texture pool, Canvas2D fallback
    shaders.js                  the film pass and the dust layer
    manifest.js                 frame manifest + source-frame mapping
    hooks.js                    device profile, countdown, scroll reveal
  components/
    loader/StoryLoader.jsx
    cinematic/CinematicExperience.jsx
    site/                       Nav, Hero, Countdown, Events, Venue,
                                Couple, Gallery, Rsvp, Footer, primitives
  styles/global.css
```

---

## A note on the mobile frames

`MOBILE FRAMES/` is byte-for-byte identical to `DESKTOP FRAMES/` — the same 300
landscape 1280×720 PNGs. There is no portrait artwork in it, so the mobile
experience is built from the same landscape source: the film plays as a centred
cinema band inside its own blurred fill, punched in as far as the couple's
position in each scene safely allows (`zoomMobile` in the scene config), with
the chapter titles set in the clear space beneath the band.

If genuine portrait renders are produced later, add them as a second source
folder in `scripts/build-frames.mjs` and point the `mobile` variant at them —
nothing else needs to change.
