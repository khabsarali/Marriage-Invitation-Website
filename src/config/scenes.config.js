/* ==========================================================================
   CINEMATIC SEQUENCE CONFIGURATION

   Every number below is expressed in ORIGINAL source frame numbers (1..300 —
   the "frame 00 (N).png" files). The manifest produced by `npm run frames`
   maps those onto the deduplicated output indices at runtime, so these values
   stay readable no matter how the assets are re-encoded.

   The 300 supplied frames are one continuous render. The scene changes are
   golden light-wipes that already exist in the footage; the beats below tell
   the renderer where they are so it can grade, bloom and blur along with them.
   ========================================================================== */

export const SOURCE_COUNT = 300

/** Story beats. `kind: 'transition'` marks the light-wipe crossovers. */
export const beats = [
  {
    id: 'mehndi',
    kind: 'scene',
    from: 1,
    to: 68,
    label: 'Mehndi',
    caption: {
      kicker: 'Chapter One',
      title: 'Mehndi',
      subtitle: 'Marigolds, lantern light, and the night it all began',
      showFrom: 6,
      showTo: 58,
    },
  },
  { id: 'wipe-1', kind: 'transition', from: 69, to: 99, label: 'Mehndi → Barat' },
  {
    id: 'barat',
    kind: 'scene',
    from: 100,
    to: 147,
    label: 'Barat',
    caption: {
      kicker: 'Chapter Two',
      title: 'Barat',
      subtitle: 'Under a thousand chandeliers, two families became one',
      showFrom: 104,
      showTo: 142,
    },
  },
  { id: 'wipe-2', kind: 'transition', from: 148, to: 188, label: 'Barat → Walima' },
  {
    id: 'walima',
    kind: 'scene',
    from: 189,
    to: 243,
    label: 'Walima',
    caption: {
      kicker: 'Chapter Three',
      title: 'Walima',
      subtitle: 'A room full of roses, and everyone we love',
      showFrom: 194,
      showTo: 236,
    },
  },
  {
    id: 'finale',
    kind: 'scene',
    from: 244,
    to: 300,
    label: 'Forever',
    caption: {
      kicker: '',
      title: '',
      subtitle: '',
      showFrom: 0,
      showTo: 0,
    },
  },
]

/**
 * Colour grading + lens keyframes, interpolated across the sequence.
 *   exposure / contrast / saturation — grade
 *   tint      — rgb multiplier, keeps each chapter's palette intact
 *   vignette  — 0 none .. 1 heavy
 *   bloom     — soft highlight glow, lifted through the light-wipes
 *   blur      — cinematic defocus, lifted through the light-wipes
 *   zoom      — framing scale on wide screens. 1 = the whole 16:9 frame, with
 *               nothing cropped. Raised only where the couple has moved safely
 *               away from the edges of the plate.
 *   zoomMobile— framing scale on the 9:16 portrait render. That artwork is
 *               already composed for a phone, so 1 is the authored frame and
 *               these stay near it — this is an artistic push, not a rescue
 *               crop.
 *   fillMobile— how much of the extra punch-in needed to reach the edges of a
 *               taller-than-9:16 handset this beat may spend, 0..1. How much
 *               that is depends on the device and is computed at runtime; this
 *               is only the permission. 0 shows the authored frame whole,
 *               letterboxed into its own blurred fill.
 *
 *               The portrait render opens exactly as the landscape one does —
 *               the groom entering at the extreme left, the bride at the
 *               extreme right — so filling a 19.5:9 screen there would crop
 *               the groom out of the film entirely. The opening is therefore
 *               pinned to 0 and only opens up once they are both safely
 *               inboard, which lands as a slow push-in as they come together.
 *   drift     — how far the slow camera float is allowed to travel
 */
export const gradeKeys = [
  // Both of them enter at the extreme edges, so the opening must not crop.
  { frame: 1,   exposure: 0.96, contrast: 1.05, saturation: 1.04, tint: [1.03, 1.00, 0.94], vignette: 0.50, bloom: 0.10, blur: 0.00, zoom: 1.000, zoomMobile: 1.000, fillMobile: 0.00, drift: 0.5 },
  { frame: 20,  exposure: 1.00, contrast: 1.04, saturation: 1.05, tint: [1.03, 1.00, 0.94], vignette: 0.42, bloom: 0.12, blur: 0.00, zoom: 1.000, zoomMobile: 1.000, fillMobile: 0.00, drift: 1.0 },
  { frame: 60,  exposure: 1.01, contrast: 1.03, saturation: 1.05, tint: [1.02, 1.00, 0.95], vignette: 0.40, bloom: 0.14, blur: 0.00, zoom: 1.015, zoomMobile: 1.010, fillMobile: 1.00, drift: 1.0 },
  { frame: 84,  exposure: 1.06, contrast: 0.98, saturation: 0.98, tint: [1.05, 1.00, 0.90], vignette: 0.34, bloom: 0.46, blur: 0.55, zoom: 1.035, zoomMobile: 1.020, fillMobile: 1.00, drift: 0.6 },
  { frame: 100, exposure: 1.00, contrast: 1.05, saturation: 1.04, tint: [1.03, 0.99, 0.94], vignette: 0.42, bloom: 0.16, blur: 0.00, zoom: 1.020, zoomMobile: 1.010, fillMobile: 1.00, drift: 1.0 },
  { frame: 130, exposure: 1.00, contrast: 1.06, saturation: 1.05, tint: [1.03, 0.99, 0.93], vignette: 0.40, bloom: 0.18, blur: 0.00, zoom: 1.040, zoomMobile: 1.025, fillMobile: 1.00, drift: 1.0 },
  { frame: 168, exposure: 1.07, contrast: 0.98, saturation: 0.97, tint: [1.05, 1.00, 0.91], vignette: 0.34, bloom: 0.48, blur: 0.55, zoom: 1.045, zoomMobile: 1.030, fillMobile: 1.00, drift: 0.6 },
  { frame: 190, exposure: 1.01, contrast: 1.02, saturation: 1.00, tint: [1.01, 1.00, 0.99], vignette: 0.38, bloom: 0.16, blur: 0.00, zoom: 1.030, zoomMobile: 1.020, fillMobile: 1.00, drift: 1.0 },
  { frame: 240, exposure: 1.02, contrast: 1.01, saturation: 1.00, tint: [1.01, 1.00, 0.99], vignette: 0.36, bloom: 0.16, blur: 0.00, zoom: 1.050, zoomMobile: 1.030, fillMobile: 1.00, drift: 1.0 },
  { frame: 275, exposure: 1.02, contrast: 1.01, saturation: 1.01, tint: [1.02, 1.00, 0.98], vignette: 0.38, bloom: 0.18, blur: 0.00, zoom: 1.070, zoomMobile: 1.040, fillMobile: 1.00, drift: 0.7 },
  { frame: 300, exposure: 1.00, contrast: 1.02, saturation: 1.00, tint: [1.02, 1.00, 0.98], vignette: 0.46, bloom: 0.20, blur: 0.00, zoom: 1.090, zoomMobile: 1.050, fillMobile: 1.00, drift: 0.3 },
]

/**
 * The most the renderer may punch in to reach the edges of the screen, on top
 * of the zoom above.
 *
 * Desktop stays at 1: the 16:9 plate is shown whole on every window shape, so
 * the opening — where the two of them enter at the extreme left and right — is
 * guaranteed uncropped.
 *
 * Mobile allows up to 1.26. The 9:16 render needs about 1.22 to fill a 19.5:9
 * handset and 1.25 to fill the tallest common Android; a 16:9 phone needs none
 * of it and gets none. At 1.26 the visible band is the middle 79% of the frame
 * (x 0.10..0.90) and the couple sits inside the middle 60% of every shot, so
 * there is real margin left over for the drift to move within.
 */
export const fill = { desktop: 1.0, mobile: 1.26 }

/**
 * The closing title — the couple's names rise over the final sofa frame before
 * the film hands over to the invitation.
 */
export const finaleTitle = { showFrom: 256, showTo: 300 }

/** Scroll behaviour of the pinned cinematic stage. */
export const scroll = {
  /** Pixels of scrolling per source frame. Higher = slower, more deliberate. */
  pixelsPerFrame: { desktop: 13, mobile: 9 },
  /** Extra scroll at the end where the last frame holds and the veil fades in. */
  outroPixels: { desktop: 900, mobile: 620 },
  /** Scrub smoothing — how quickly the playhead chases the scroll position. */
  ease: { desktop: 0.12, mobile: 0.16 },
}

/**
 * The score that plays under the film, and only under the film — it fades out
 * as the invitation takes over.
 *
 * `volume` is the ceiling it fades up to, 0..1. Kept well below 1: this starts
 * on a phone in someone's hand, possibly in company.
 *
 * Set `enabled: false` to ship the film silent.
 */
export const sound = {
  enabled: true,
  src: '/Audio/film.mp3',
  volume: 0.45,
  fadeIn: 2.4,
  fadeOut: 1.4,
}

/** Loading strategy. */
export const loading = {
  /** Load every Nth frame first so the film can start before everything lands. */
  coarseStride: 4,
  /** …plus this many leading frames at full density, for a flawless opening. */
  leadFrames: 24,
  /** Concurrent image requests. */
  concurrency: { desktop: 12, mobile: 6 },
  /** Frames kept decoded on the GPU at once. */
  textureBudget: { desktop: 28, mobile: 14 },
}

/* -------------------------------------------------------------------------- */

export const sceneBeats = beats.filter((b) => b.kind === 'scene')

/** Normalised 0..1 position of a source frame within the whole sequence. */
export const frameToProgress = (frame) => (frame - 1) / (SOURCE_COUNT - 1)

const pickZoom = (key, isMobile) => (isMobile ? key.zoomMobile : key.zoom)
// Desktop is always shown whole, so it never spends any of the fill punch-in.
const pickFill = (key, isMobile) => (isMobile ? key.fillMobile : 0)

/** Interpolate the grade keyframes at a given source frame. */
export function gradeAt(frame, isMobile = false) {
  const keys = gradeKeys
  const clamped = (key) => ({
    ...key,
    zoom: pickZoom(key, isMobile),
    fill: pickFill(key, isMobile),
  })
  if (frame <= keys[0].frame) return clamped(keys[0])
  const last = keys[keys.length - 1]
  if (frame >= last.frame) return clamped(last)

  let i = 0
  while (i < keys.length - 2 && keys[i + 1].frame < frame) i++
  const a = keys[i]
  const b = keys[i + 1]
  const t = (frame - a.frame) / (b.frame - a.frame)
  const s = t * t * (3 - 2 * t) // smoothstep, so the grade never snaps

  const lerp = (x, y) => x + (y - x) * s
  return {
    exposure: lerp(a.exposure, b.exposure),
    contrast: lerp(a.contrast, b.contrast),
    saturation: lerp(a.saturation, b.saturation),
    tint: [
      lerp(a.tint[0], b.tint[0]),
      lerp(a.tint[1], b.tint[1]),
      lerp(a.tint[2], b.tint[2]),
    ],
    vignette: lerp(a.vignette, b.vignette),
    bloom: lerp(a.bloom, b.bloom),
    blur: lerp(a.blur, b.blur),
    zoom: lerp(pickZoom(a, isMobile), pickZoom(b, isMobile)),
    fill: lerp(pickFill(a, isMobile), pickFill(b, isMobile)),
    drift: lerp(a.drift, b.drift),
  }
}
