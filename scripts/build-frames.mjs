/**
 * Frame pipeline.
 *
 * Two independent renders of the same film, one per orientation:
 *
 *   desktop  "DESKTOP FRAMES/frame 00 (N).png"   N = 1..300, 1280x720, ~293 MB
 *   mobile   "Mobile/ezgif-frame-NNN.png"        N = 1..300, 1080x1920, ~592 MB
 *
 * Both are 24 fps renders exported at 30 fps, so every 5th frame is an exact
 * duplicate of the one before it. We drop those (300 -> 240 unique frames),
 * which removes 20% of the payload and yields a perfectly uniform sequence.
 *
 * The two sources must decimate to the SAME set of source frame numbers,
 * because the manifest carries one shared sourceToOut map that the scene config
 * is authored against. That is asserted below rather than assumed — if a future
 * re-export changes the cadence of one orientation, the build fails loudly
 * instead of silently desynchronising the mobile film from its scene beats.
 *
 * Emits WebP per variant plus that manifest.
 *
 *   npm run frames
 */
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The single source of truth for how long the film is. Importing it means a
// re-export with a different frame count fails here rather than quietly
// desynchronising every beat in the scene config.
import { SOURCE_COUNT as EXPECTED_SOURCE_COUNT } from '../src/config/scenes.config.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'frames')
const STILL_DIR = path.join(ROOT, 'public', 'stills')

/**
 * `width`/`height` are the encoded output size, not the source size.
 *
 * Mobile lands at 720x1280. A phone renders the stage at a device pixel ratio
 * capped to 2 (see CinematicExperience), so a 390pt-wide screen asks for 780
 * physical pixels across — 720 is within a hair of that, while 608 or below
 * would visibly upscale. Both variants carry the same pixel count, so the two
 * payloads come out comparable.
 *
 * `from` is the source folder. Nothing about the filenames is assumed — see
 * discover() — so a re-export under different naming needs no code change.
 */
const VARIANTS = [
  { key: 'desktop', from: 'DESKTOP FRAMES', dir: 'desktop', width: 1280, height: 720, quality: 76 },
  { key: 'mobile', from: 'Mobile', dir: 'mobile', width: 720, height: 1280, quality: 70 },
]

const IMAGE_RE = /\.(png|jpe?g|webp|tiff?)$/i
/**
 * The last run of digits in the name. That is the frame number in both of the
 * naming schemes in play — "frame 00 (7).png" and "ezgif-frame-007.png" — and
 * in most others, because a trailing counter is the near-universal convention.
 */
const frameNumber = (name) => {
  const m = name.match(/(\d+)(?!.*\d)/)
  return m ? Number(m[1]) : NaN
}

/**
 * Read a source folder and return its frames in playback order.
 *
 * Order comes from the parsed number, never from readdir order or a string
 * sort — "frame 00 (10).png" sorts before "frame 00 (9).png" alphabetically,
 * which would shuffle the film. Gaps and duplicates are reported rather than
 * silently absorbed.
 */
async function discover(folder) {
  const dir = path.join(ROOT, folder)
  let entries
  try {
    entries = await fs.readdir(dir)
  } catch {
    throw new Error(`source folder not found: ${folder}/`)
  }

  const frames = entries
    .filter((f) => IMAGE_RE.test(f))
    .map((file) => ({ file, n: frameNumber(file) }))
    .filter((f) => Number.isFinite(f.n))
    .sort((a, b) => a.n - b.n)

  if (!frames.length) throw new Error(`no numbered image files in ${folder}/`)

  const numbers = frames.map((f) => f.n)
  const dupes = numbers.filter((n, i) => i && n === numbers[i - 1])
  if (dupes.length) {
    throw new Error(
      `${folder}/ has more than one file numbered ${[...new Set(dupes)].slice(0, 5).join(', ')} — ` +
        `the frame order would be ambiguous.`
    )
  }

  const first = numbers[0]
  const last = numbers[numbers.length - 1]
  const gaps = last - first + 1 - numbers.length
  const ext = path.extname(frames[0].file)
  console.log(
    `${folder}/: ${frames.length} frames${ext ? ` (${ext})` : ''}, ` +
      `numbered ${first}..${last}${gaps ? `, ${gaps} missing` : ''}`
  )

  return frames.map((f) => path.join(dir, f.file))
}

/** Full-frame stills reused by the gallery (authored in source frame numbers). */
const STILLS = [
  { name: 'mehndi-mandap', frame: 8, caption: 'The mehndi mandap' },
  { name: 'mehndi-arrival', frame: 34, caption: 'Arrival' },
  { name: 'mehndi-together', frame: 64, caption: 'Mehndi night' },
  { name: 'barat-hall', frame: 104, caption: 'The barat' },
  { name: 'barat-couple', frame: 138, caption: 'Side by side' },
  { name: 'walima-stage', frame: 196, caption: 'Walima' },
  { name: 'walima-couple', frame: 228, caption: 'The reception' },
  { name: 'sofa-final', frame: 288, caption: 'Happily ever after' },
]

/**
 * Portrait crops for the couple section, taken straight from the render.
 * Boxes are 4:5 and measured against source frame 206 (1280x720): the groom
 * occupies x 405-590 and the bride x 690-870, so neither box clips the other
 * person or cuts anybody off.
 */
const PORTRAITS = [
  { name: 'groom', frame: 206, left: 320, top: 0, width: 336, height: 420 },
  { name: 'bride', frame: 206, left: 616, top: 0, width: 336, height: 420 },
]

const sha1 = (buf) => createHash('sha1').update(buf).digest('hex')
const pad = (n) => String(n).padStart(3, '0')

/** `npm run frames -- --stills` re-cuts only the gallery/portrait images. */
const STILLS_ONLY = process.argv.includes('--stills')

async function main() {
  if (!STILLS_ONLY) {
    await fs.rm(OUT_DIR, { recursive: true, force: true })
    for (const v of VARIANTS) await fs.mkdir(path.join(OUT_DIR, v.dir), { recursive: true })
  }
  await fs.mkdir(STILL_DIR, { recursive: true })

  // ---- pass 0: discover -----------------------------------------------------
  for (const v of VARIANTS) v.files = await discover(v.from)

  // Every variant is the same film, so they must run the same length. The
  // config addresses frames by position, which only means anything if they do.
  const [lead, ...others] = VARIANTS
  for (const v of others) {
    if (v.files.length !== lead.files.length) {
      throw new Error(
        `${lead.from}/ has ${lead.files.length} frames but ${v.from}/ has ${v.files.length}. ` +
          `Both are the same film and are addressed by position, so they must match.`
      )
    }
  }

  const SOURCE_COUNT = lead.files.length
  if (SOURCE_COUNT !== EXPECTED_SOURCE_COUNT) {
    throw new Error(
      `the sources carry ${SOURCE_COUNT} frames but scenes.config.js is authored ` +
        `against ${EXPECTED_SOURCE_COUNT}. Update SOURCE_COUNT and the beat/grade ` +
        `frame numbers there to match the new footage.`
    )
  }

  /** Frames are addressed 1..SOURCE_COUNT by position in the discovered order. */
  const srcPathFor = (v) => (n) => v.files[n - 1]
  const srcPath = srcPathFor(lead)

  // ---- pass 1: dedupe -------------------------------------------------------
  /** Source frame numbers that survive dropping each exact repeat of its predecessor. */
  const decimate = async (pathFor) => {
    const kept = []
    let prevHash = null
    for (let n = 1; n <= SOURCE_COUNT; n++) {
      const hash = sha1(await fs.readFile(pathFor(n)))
      if (hash !== prevHash) {
        kept.push(n)
        prevHash = hash
      }
    }
    return kept
  }

  let kept = [1]
  if (!STILLS_ONLY) {
    const perVariant = []
    for (const v of VARIANTS) {
      const k = await decimate(srcPathFor(v))
      console.log(`dedupe ${v.key}: ${SOURCE_COUNT} source frames -> ${k.length} unique`)
      perVariant.push({ key: v.key, kept: k })
    }

    // One shared sourceToOut only holds if every source decimated the same way.
    const [first, ...rest] = perVariant
    for (const other of rest) {
      if (first.kept.length !== other.kept.length ||
          first.kept.some((n, i) => n !== other.kept[i])) {
        const diverge = first.kept.findIndex((n, i) => n !== other.kept[i])
        throw new Error(
          `${first.key} and ${other.key} do not share a frame cadence ` +
            `(${first.kept.length} vs ${other.kept.length} unique frames, ` +
            `first divergence at output index ${diverge < 0 ? 'end' : diverge}). ` +
            `The manifest carries one sourceToOut map for every variant, so the ` +
            `two renders must drop the same duplicates. Re-export them at a ` +
            `matching frame rate, or give each variant its own map.`
        )
      }
    }
    kept = first.kept
  }

  // Each source frame maps to the most recent kept frame at or before it.
  const sourceToOut = new Array(SOURCE_COUNT + 1).fill(0)
  for (let n = 1, out = 0; n <= SOURCE_COUNT; n++) {
    while (out + 1 < kept.length && kept[out + 1] <= n) out++
    sourceToOut[n] = out
  }

  // ---- pass 2: encode -------------------------------------------------------
  const bytes = {}
  for (const v of STILLS_ONLY ? [] : VARIANTS) {
    let total = 0
    for (let i = 0; i < kept.length; i++) {
      const out = path.join(OUT_DIR, v.dir, `f${pad(i)}.webp`)
      await sharp(srcPathFor(v)(kept[i]))
        .resize(v.width, v.height, { fit: 'fill' })
        .webp({ quality: v.quality, effort: 5, smartSubsample: true })
        .toFile(out)
      total += (await fs.stat(out)).size
      if (i % 40 === 0) process.stdout.write(`  ${v.key} ${i}/${kept.length}\r`)
    }
    bytes[v.key] = total
    console.log(`  ${v.key}: ${kept.length} files, ${(total / 1048576).toFixed(1)} MB   `)
  }

  // ---- stills + portraits ---------------------------------------------------
  for (const s of STILLS) {
    await sharp(srcPath(s.frame))
      .resize(1280, 720, { fit: 'fill' })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(STILL_DIR, `${s.name}.webp`))
  }
  for (const p of PORTRAITS) {
    await sharp(srcPath(p.frame))
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .resize(672, 840, { fit: 'fill' })
      .webp({ quality: 84, effort: 6 })
      .toFile(path.join(STILL_DIR, `${p.name}.webp`))
  }
  await fs.writeFile(
    path.join(ROOT, 'src', 'config', 'stills.generated.js'),
    `/* Generated by scripts/build-frames.mjs — do not edit by hand. */\n` +
      `export const stills = ${JSON.stringify(
        STILLS.map((s) => ({ name: s.name, caption: s.caption, src: `/stills/${s.name}.webp` })),
        null,
        2
      )}\n`
  )
  console.log(`stills: ${STILLS.length} gallery + ${PORTRAITS.length} portraits`)
  if (STILLS_ONLY) return

  // ---- low quality image placeholder (instant first paint) ------------------
  const lqipBuf = await sharp(srcPath(kept[0]))
    .resize(32, 18, { fit: 'fill' })
    .blur(1.4)
    .webp({ quality: 40 })
    .toBuffer()
  const lqip = `data:image/webp;base64,${lqipBuf.toString('base64')}`

  // ---- manifest -------------------------------------------------------------
  const manifest = {
    generatedFrom: Object.fromEntries(VARIANTS.map((v) => [v.key, `${v.from}/`])),
    sourceCount: SOURCE_COUNT,
    count: kept.length,
    lqip,
    /** `aspect` differs per variant — desktop is 16:9, mobile is a 9:16 render. */
    variants: Object.fromEntries(
      VARIANTS.map((v) => [
        v.key,
        {
          path: `/frames/${v.dir}`,
          width: v.width,
          height: v.height,
          aspect: v.width / v.height,
          bytes: bytes[v.key],
        },
      ])
    ),
    /** sourceToOut[sourceFrameNumber] -> output frame index */
    sourceToOut,
    stills: STILLS.map((s) => ({ ...s, src: `/stills/${s.name}.webp` })),
  }
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest))

  // Human-readable mapping for the scene config.
  const marks = [1, 68, 69, 99, 100, 147, 148, 188, 189, 243, 244, 256, 257, 300]
  console.log('\nsource frame -> output index')
  console.log(marks.map((m) => `  ${m} -> ${sourceToOut[m]}`).join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
