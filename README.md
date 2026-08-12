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

`scripts/build-frames.mjs` reads the two source renders and writes everything
the site serves. It is the only place the source PNGs are touched.

| | |
|---|---|
| Source | two renders of 300 PNG frames — see [The two renders](#the-two-renders) |
| Deduplicated | 240 unique frames — both were exported at 30 fps from a 24 fps source, so every 5th frame was an exact duplicate |
| `public/frames/desktop` | 240 × WebP 1280×720 — **15.9 MB** |
| `public/frames/mobile` | 240 × WebP 720×1280 — **16.5 MB** |
| `public/stills` | 8 gallery frames + 2 portrait crops, cut from the desktop plate |

It also writes `public/frames/manifest.json` (which maps the original frame
numbers onto output indices, so the scene config stays readable) and
`src/config/stills.generated.js`.

```bash
npm run frames             # full rebuild
npm run frames -- --stills # re-cut only the gallery and portrait images
```

> The source render folders are **not in the repository** — 1.2 GB between
> them, and only ever inputs to this script. Everything the site serves is
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

**Sound** — a score plays under the film and fades out as the invitation takes
over. It is `public/Audio/film.mp3`, configured by `sound` in
`scenes.config.js` (set `enabled: false` to ship it silent).

The track is about half a minute against a film that runs longer, so it loops.
That is why this uses Web Audio rather than an `<audio>` element: an
`AudioBufferSourceNode` loops without the gap an `HTMLMediaElement` leaves at
the seam, and a `GainNode` gives real fades instead of a hard cut.

No browser starts audio before the guest has interacted with the page, and
**scrolling does not count** — only pointer, touch and key events grant
activation. So nothing is constructed until the first such gesture, and the
score then joins the film wherever it has got to. The toggle at the top left
shows what is actually audible rather than what is merely intended, so it reads
"Music off" until the score is genuinely unlocked and decoded; the guest's
choice is remembered in `localStorage`. Background tabs suspend the context and
keep their place.

**Fallbacks** — no WebGL falls back to a Canvas2D renderer with the same
framing rules; `prefers-reduced-motion` disables the drift, dust and scrub
smoothing; and if the manifest cannot be loaded at all, the invitation is shown
without the film rather than failing. If the score cannot be fetched or
decoded, or Web Audio is missing, the film simply plays silent.

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
    FilmAudio.js                the score — gapless loop, fades, gesture unlock
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

## The two renders

The film is supplied twice, once per orientation, and each variant is built
from its own source:

| | | |
|---|---|---|
| `DESKTOP FRAMES/` | 300 × 1280×720 landscape | → `public/frames/desktop`, 240 × WebP 1280×720 |
| `Mobile/` | 300 × 1080×1920 portrait | → `public/frames/mobile`, 240 × WebP 720×1280 |

So a phone gets artwork actually composed for a phone, not a landscape plate
letterboxed into a tall screen. 720 wide is deliberate: the stage renders at a
device pixel ratio capped to 2, so a 390pt screen asks for 780 physical pixels
across and anything smaller would visibly upscale.

Both are 24 fps renders exported at 30 fps. They must decimate to the *same*
240 frames, because the manifest carries one `sourceToOut` map that
`scenes.config.js` is authored against — the pipeline asserts this rather than
assuming it, and fails loudly if a future re-export changes one orientation's
cadence.

**Framing.** The portrait render opens the way the landscape one does, with the
groom entering at the extreme left and the bride at the extreme right, so
filling a 19.5:9 screen at that moment would crop the groom out of the film
entirely. Each grade keyframe therefore carries a `fillMobile` permission
(0..1) saying how much of the punch-in needed to reach that particular screen's
edges the beat may spend. The opening spends none — the whole authored frame is
shown, letterboxed into its own blurred fill — and it opens up once the two of
them are safely inboard, which reads as a slow push-in as they come together.
How much punch-in a screen needs is computed per device, so a 9:16 handset uses
none of it and the tallest Android uses all of it.

(An earlier `MOBILE FRAMES/` folder held a byte-for-byte copy of
`DESKTOP FRAMES/` rather than any portrait artwork. It has been deleted.)
