# Marriage Invitation Website

A digital wedding invitation for Radia and Umar, built to read like luxury
stationery rather than a wedding template: three grounds (paper, ivory, ink),
two typefaces, gold used only as a hairline, and no cards anywhere.

The visitor opens on the monogram, then the invitation runs:

```
envelope  ->  hero  ->  Dubai × Karachi  ->  announcement  ->  the couple
          ->  order of events  ->  countdown  ->  RSVP  ->  closing
```

**Every fact appears exactly once.** The names are the hero and the closing
page; the two date ranges belong to the cities section and are set nowhere
else; the hosts belong to the announcement. If something starts appearing
twice, the second one is the mistake.

A scroll-driven WebGL film — **Mehndi → Barat → Walima** — is also in this
repository, and is **off**. See [No film, and what that
means](#no-film-and-what-that-means).

---

## Quick start

```bash
npm install
npm run frames     # one-off: turns the source PNGs into optimised web assets
npm run logo       # one-off: keys the monogram off its card and cuts favicons
npm run stills     # one-off: builds the ambient plates the page paints with
npm run dev
```

`npm run build` produces `dist/`, which is a plain static site — it can be
dropped on Netlify, Vercel, Cloudflare Pages, GitHub Pages or any static host.

---

## Editing the wedding details

**Everything a guest reads lives in [`src/config/wedding.config.js`](src/config/wedding.config.js).**
Names, the two cities and their dates, the countdown, all three evenings, the
RSVP settings and the Instagram handle. No component hardcodes any of it.

Anything not yet settled is `null` rather than guessed — the three evenings have
no dates, times or venues, so they read "To be announced". Fill a value in and
it appears; nothing else has to change. The same is true of photography: set
`cities[].image` and that city's engraving becomes a photograph, or set
`couple.bride.image` and the couple reveal gains a portrait.

The RSVP form works without a backend: it validates, stores the reply locally
and hands off to WhatsApp or email once `rsvp.whatsapp` / `rsvp.email` are set.
If you would rather collect replies centrally, set `rsvp.endpoint` to a form
endpoint (Formspree, Getform, Basin, your own API) and the form will `POST` JSON
to it as well.

The film's pacing, grading and chapter titles live in
[`src/config/scenes.config.js`](src/config/scenes.config.js), along with the
switch that turns it on.

---

## No film, and what that means

`ENABLE_3D_EXPERIENCE` in [`src/config/scenes.config.js`](src/config/scenes.config.js)
is `false`. The film is not merely hidden — it is absent:

* `App.jsx` renders `FilmStage` behind that flag **and** behind a dynamic
  import, so with the flag off the module is never fetched. Nothing pulls in
  three.js, GSAP, the frame loader, the score or `film.css`.
* The frame manifest is never requested, so not one of the 34 MB of frames is
  either — on desktop, laptop, tablet or phone.
* No 3D CSS ships with the page: the stage, chapter rail, sound toggle and film
  loader live in [`src/styles/film.css`](src/styles/film.css), which only
  `CinematicExperience.jsx` imports.

What a visitor downloads is the invitation: one JS bundle, one stylesheet, the
monogram and one plate.

Set the flag to `true` and the film returns, mounted between the hero and the
rest of the invitation. Two things to know if you do: the page's own preloader
opens first and `FilmStage`'s loader then holds the page while frames prime, and
the redesigned invitation no longer fades its ivory ground into the film's
black, so the hand-over will want a look at.

---

## The ambient plates

The page paints with three large, quiet images —
[`scripts/build-stills.mjs`](scripts/build-stills.mjs), `npm run stills`.

There is no photography of Radia and Umar in this project, and every frame of
the film shows a stand-in couple, so no frame can be used as-is: it would read
as a photograph of them, which it is not. What the frames *do* hold is the set,
and a camera that pushes in across every scene. Taking the per-pixel median of a
whole scene keeps the set and turns that push-in into a radial smear, so what
comes out is the light and the palette of the evening with nobody in it.

| | |
|---|---|
| `hero-wide.webp`, `hero-tall.webp` | the mehndi set — marigold light behind the names, one per orientation |
| `chandeliers.webp` | the barat hall, behind the countdown |
| `roses.webp` | the walima room, behind the closing page |

The two interiors keep a soft silhouette mid-frame, so those plates take a side
of the room instead of the whole median; the crop is in the script and is
commented there.

The cities are **drawn**, not photographed — see
[`src/components/site/Skyline.jsx`](src/components/site/Skyline.jsx). Fine line
work belongs to the same world as a printed invitation, where a stock skyline
photograph does not.

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
| `public/stills/mobile` | the same ten, cut from the portrait plate instead |

It also writes `public/frames/manifest.json` (which maps the original frame
numbers onto output indices, so the scene config stays readable) and
`src/config/stills.generated.js`.

> The gallery stills and portrait crops in that table are **not used by the
> page**. They are full frames of the film's stand-in couple, and the redesigned
> invitation shows no photograph of a couple at all — the plates it does paint
> with come from `npm run stills` instead, and are named differently, so running
> either script never overwrites the other's output.

```bash
npm run frames             # full rebuild
npm run frames -- --stills # re-cut only the gallery and portrait images
```

Nothing about the source filenames is hardcoded. Each folder is read at build
time, frames are ordered by the last run of digits in each name — which is the
frame number under both `frame 00 (7).png` and `ezgif-frame-007.png` — and the
count, extension, numbering range and any gaps are reported. A duplicate number
is a hard error, because the frame order would be ambiguous. The frame count is
cross-checked against `SOURCE_COUNT` in `scenes.config.js`, so a re-export of a
different length fails here instead of quietly desynchronising every beat.

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

**Framing** — the plate is drawn *cover*: it reaches every edge of the window,
which is `object-fit: cover` expressed in the shader rather than in CSS, since
the film is a canvas and not an `<img>`. `coverZoom` works out the punch-in the
window needs and, crucially, **which way the crop runs**, because the two
directions are not equally safe. A window wider than 16:9 crops ceiling and
floor, which is harmless in every shot. A narrower one crops the left and right
edges of the plate — exactly where the groom and bride enter during the
opening — so there each beat's own `fillDesktop` permission decides, and the
opening spends none of it and is guaranteed uncropped.

The punch-in is capped per axis (`fill` in the scene config). Desktop stops at
1.12: a 1440×900 window needs 1.11 and a 1080p window about 1.13, so the common
shapes cover completely, while past roughly 1.19 a vertical crop starts taking
the groom's turban and the couple's feet — measured against the frames, and
drift adds about 3% on top of it. Very wide, short windows therefore keep a
slim blurred margin rather than lose the composition. Whatever margin remains
is filled with a heavily blurred, darkened copy of the same frame, so there is
never a hard letterbox at any aspect ratio. The camera drift budget is derived
from the punch-in (`driftBudget`), so it is exactly zero while the frame is
shown whole.

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
brand/monogram.jpg              the supplied RU monogram, on its white card
scripts/build-frames.mjs        asset pipeline (source PNGs -> WebP + manifest)
scripts/build-logo.mjs          monogram -> keyed WebP marks + favicons
scripts/build-stills.mjs        film frames -> the page's ambient plates
src/
  config/
    wedding.config.js           >>> all wedding content <<<
    scenes.config.js            the film: on/off switch, beats, grading, pacing
  lib/
    hooks.js                    device profile, countdown, reveal, parallax
    FrameSequence.js            film — streaming loader + bounded decode window
    FilmAudio.js                film — the score, gapless loop, gesture unlock
    CinematicRenderer.js        film — WebGL stage, Canvas2D fallback
    shaders.js                  film — the film pass and the dust layer
    manifest.js                 film — frame manifest + source-frame mapping
  components/
    loader/Preloader.jsx        the envelope, shown while fonts and the plate land
    loader/StoryLoader.jsx      the film's loader (not on the page today)
    cinematic/FilmStage.jsx     everything the film needs, behind the switch
    cinematic/CinematicExperience.jsx
    site/
      primitives.jsx            Reveal, MaskLines, Rule, Eyebrow, Section
      Nav.jsx                   five words, a monogram, and a sheet on phones
      Hero.jsx                  the names, at full scale, once
      Crossing.jsx + Skyline.jsx    Dubai × Karachi, and their only dates
      Announcement.jsx          the hosts' announcement — type and air
      CoupleReveal.jsx          Radia · with · Umar, and the verse
      Events.jsx                the order of events, as a timeline
      Countdown.jsx             one countdown, four numerals
      Rsvp.jsx                  the response card
      Closing.jsx               the back of the card
  styles/
    global.css                  the invitation
    film.css                    the film, loaded only with the film
```

---

## The monogram

`brand/monogram.jpg` is the supplied lockup — the gold RU mark with the names
under it, flat on a near-white card. `npm run logo` keys that card out to real
alpha and emits `public/brand/`:

| | |
|---|---|
| `mark.webp` | the monogram alone — nav, loader, hero |
| `logo.webp` | the full lockup, mark plus names |
| `icon-32.png`, `icon-180.png` | favicon and touch icon, gold on the ink tile |

The site puts this on ivory in the invitation and on near-black behind the
film, so the white card is keyed out once here rather than fought with blend
modes at runtime. The key is on *distance from the card colour*, not the usual
`alpha = 1 - luminance`: that would make the pale highlights running through
the gold semi-transparent, which then go muddy over the dark backdrop. Keying
on distance keeps every pixel of the mark at full opacity and true colour and
only softens the last few levels at the edge.

The mark is cut from the lockup by finding the first run of blank rows beneath
the monogram rather than at a fixed fraction, so a redrawn logo with different
proportions still splits in the right place. The nav, loader and hero use the
mark and not the full lockup, because the names are already set in type on
those screens and printing them twice reads as a mistake.

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

**The stills too.** The film was never the only place a frame reached the page:
the gallery tiles, the event cards and the couple portraits are stills cut from
the render, and those were all cut from the landscape plate — so a phone that
correctly played the portrait film still scrolled into a screenful of desktop
frames. They are now cut from both plates, and `Still` in `primitives.jsx`
serves them through a `<picture>` whose `<source media>` matches the loader's
breakpoint, so the browser fetches exactly one set.

The mobile cuts stay 16:9 rather than becoming portrait images. The gallery
tiles and event cards are fixed `aspect-ratio: 16 / 9` boxes with
`object-fit: cover`, so a 9:16 source would be cover-cropped to a narrow middle
band with the heads cut off; taking a 16:9 band out of the portrait plate keeps
every layout rule untouched. Because that plate frames the couple far tighter,
the band lands as a head-and-shoulders shot — a better thumbnail than the wide
master it replaces.

(An earlier `MOBILE FRAMES/` folder held a byte-for-byte copy of
`DESKTOP FRAMES/` rather than any portrait artwork. It has been deleted.)
