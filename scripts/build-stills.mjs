/**
 * Ambient plates for the invitation.
 *
 *   npm run stills
 *
 * The invitation needs a few large, quiet images to sit behind type — the hero,
 * the countdown, the closing page. The project has no photography of Radia and
 * Umar, and the film's frames all show a stand-in couple, so a frame cannot be
 * used as-is: it would read as a photograph of them, which it is not.
 *
 * What the frames do hold is the set — marigolds, chandeliers, roses, candle
 * light — and a camera that pushes in across every scene. Taking the per-pixel
 * median of a whole scene therefore keeps the set and turns that push-in into a
 * radial smear, so what comes out is the light and the palette of the evening
 * with no identifiable person in it. That is exactly the ambient plate the
 * design wants, and it is derived from the project's own assets.
 *
 * `crop` selects the part of the median that has no figure left in it. The
 * mehndi scene dissolves completely and is used whole; the two interiors keep a
 * soft silhouette mid-frame, so those take a side of the room instead.
 *
 * Output is deliberately soft and only lightly darkened: the page layers its
 * own scrims over these, and grading them down twice would leave no latitude.
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FRAMES = path.join(ROOT, 'public', 'frames')
const OUT = path.join(ROOT, 'public', 'stills')

/** Output frames are named f000.webp… inside a content-hashed directory. */
async function variantDir(profile) {
  const base = path.join(FRAMES, profile)
  const [dir] = await fs.readdir(base)
  if (!dir) throw new Error(`no ${profile} frames in ${base} — run \`npm run frames\` first`)
  return path.join(base, dir)
}

const frameFile = (dir, i) => path.join(dir, `f${String(i).padStart(3, '0')}.webp`)

/**
 * Per-pixel median of a set of frames.
 *
 * Median rather than mean: a mean of a moving subject leaves a ghost of it at
 * every position it held, while the median keeps whatever the pixel showed for
 * most of the scene — the set — and discards the passer-by.
 */
async function medianPlate(dir, frames) {
  const planes = []
  let width = 0
  let height = 0

  for (const i of frames) {
    const { data, info } = await sharp(frameFile(dir, i))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    width = info.width
    height = info.height
    planes.push(data)
  }

  const len = width * height * 3
  const out = Buffer.alloc(len)
  const n = planes.length
  const sample = new Uint8Array(n)
  const mid = n >> 1

  for (let i = 0; i < len; i++) {
    for (let k = 0; k < n; k++) sample[k] = planes[k][i]
    // Insertion sort: n is ~25, and this runs 2.7M times — a comparator-based
    // sort on a fresh array here costs minutes rather than seconds.
    for (let a = 1; a < n; a++) {
      const v = sample[a]
      let b = a - 1
      while (b >= 0 && sample[b] > v) {
        sample[b + 1] = sample[b]
        b--
      }
      sample[b + 1] = v
    }
    out[i] = sample[mid]
  }

  return { data: out, width, height }
}

const range = (from, to, step = 2) => {
  const list = []
  for (let i = from; i <= to; i += step) list.push(i)
  return list
}

/**
 * The plates.
 *
 * `frames` are output indices of the deduplicated sequence, chosen inside one
 * scene — a set that crossed a light-wipe would median two rooms together.
 * `crop` is a fraction of the median: [left, top, width, height].
 */
const PLATES = [
  {
    name: 'hero-wide',
    profile: 'desktop',
    frames: range(0, 52),
    crop: [0, 0, 1, 1],
    width: 1760,
    blur: 2.4,
    brightness: 0.82,
    saturation: 0.92,
  },
  {
    name: 'hero-tall',
    profile: 'mobile',
    frames: range(0, 52),
    crop: [0, 0, 1, 1],
    width: 900,
    blur: 1.8,
    brightness: 0.82,
    saturation: 0.92,
  },
  {
    // The barat hall: chandeliers and arcades down the left of the room. The
    // pair drift a third of the way across in this scene, so the crop stops
    // well short of them — the upscale that costs is affordable in a wash this
    // faint, and losing them is the point.
    name: 'chandeliers',
    profile: 'desktop',
    frames: range(82, 118),
    crop: [0, 0, 0.25, 1],
    width: 900,
    blur: 1.2,
    brightness: 0.86,
    saturation: 0.9,
  },
  {
    // The walima room: roses, candles and the pale marble of the far side.
    name: 'roses',
    profile: 'desktop',
    frames: range(152, 194),
    crop: [0, 0, 0.25, 1],
    width: 900,
    blur: 1.2,
    brightness: 0.88,
    saturation: 0.92,
  },
]

async function main() {
  await fs.mkdir(OUT, { recursive: true })

  const dirs = {
    desktop: await variantDir('desktop'),
    mobile: await variantDir('mobile'),
  }

  for (const plate of PLATES) {
    const dir = dirs[plate.profile]
    const { data, width, height } = await medianPlate(dir, plate.frames)

    const [cl, ct, cw, ch] = plate.crop
    const region = {
      left: Math.round(cl * width),
      top: Math.round(ct * height),
      width: Math.round(cw * width),
      height: Math.round(ch * height),
    }

    const file = path.join(OUT, `${plate.name}.webp`)
    await sharp(data, { raw: { width, height, channels: 3 } })
      .extract(region)
      .resize({ width: plate.width, kernel: 'lanczos3' })
      .blur(plate.blur)
      .modulate({ brightness: plate.brightness, saturation: plate.saturation })
      .webp({ quality: 74, effort: 6 })
      .toFile(file)

    const { size } = await fs.stat(file)
    const meta = await sharp(file).metadata()
    console.log(
      `${plate.name}: ${plate.frames.length} frames of ${plate.profile} → ` +
        `${meta.width}x${meta.height}, ${(size / 1024).toFixed(0)} kB`
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
