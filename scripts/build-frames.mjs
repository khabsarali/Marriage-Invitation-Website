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
const MOBILE_STILL_DIR = path.join(STILL_DIR, 'mobile')

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

/**
 * The same stills again, cut from the portrait render for phones, so nothing
 * on a phone is ever a crop of the landscape plate.
 *
 * These stay 16:9 rather than becoming portrait images. The gallery tiles and
 * event cards are fixed `aspect-ratio: 16 / 9` boxes with `object-fit: cover`;
 * feeding them a 9:16 source would cover-crop it to a narrow middle band and
 * cut the heads off. Cutting a 16:9 band out of the portrait plate instead
 * keeps every existing layout rule untouched, and because that plate frames
 * the couple far tighter than the landscape one, the band lands as a
 * head-and-shoulders shot — a better thumbnail than the wide master.
 *
 * 1080 x 608 is 16:9 out of the 1080x1920 plate; top 300 puts the cut just
 * under the ceiling so both faces sit inside it.
 */
const MOBILE_BAND = { left: 0, top: 300, width: 1080, height: 608 }

/** 4:5 boxes measured against the portrait plate at frame 206, where the
 *  groom spans x 12-48% and the bride x 52-88%, heads at y 19-21%. */
const MOBILE_PORTRAITS = [
  { name: 'groom', frame: 206, left: 90, top: 330, width: 460, height: 575 },
  { name: 'bride', frame: 206, left: 545, top: 350, width: 460, height: 575 },
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

  /** Each source frame maps to the most recent kept frame at or before it. */
  const mapSourceToOut = (kept) => {
    const map = new Array(SOURCE_COUNT + 1).fill(0)
    for (let n = 1, out = 0; n <= SOURCE_COUNT; n++) {
      while (out + 1 < kept.length && kept[out + 1] <= n) out++
      map[n] = out
    }
    return map
  }

  // Every variant carries its own decimation. The two renders were once
  // exported at a matching cadence and could share one map, but they are
  // separate exports and nothing guarantees that — the second one landed with
  // a different set of duplicates. Keeping a map per variant means each film
  // stays in step with the scene beats no matter how its own export was cut.
  for (const v of VARIANTS) {
    v.kept = STILLS_ONLY ? [1] : await decimate(srcPathFor(v))
    v.sourceToOut = mapSourceToOut(v.kept)
    if (!STILLS_ONLY) {
      console.log(`dedupe ${v.key}: ${SOURCE_COUNT} source frames -> ${v.kept.length} unique`)
    }
  }

  // Stills and the LQIP are cut from whichever frame the config names, so they
  // only need the lead variant's own decimation.
  const kept = VARIANTS[0].kept

  // ---- pass 2: encode -------------------------------------------------------
  const bytes = {}
  for (const v of STILLS_ONLY ? [] : VARIANTS) {
    // Encoded in memory first so the whole set can be hashed before it is
    // written: the hash becomes a path segment, which is what makes these
    // URLs safe to cache forever. ~17 MB held briefly, per variant.
    let total = 0
    const encoded = []
    const digest = createHash('sha1')
    for (let i = 0; i < v.kept.length; i++) {
      const buf = await sharp(srcPathFor(v)(v.kept[i]))
        .resize(v.width, v.height, { fit: 'fill' })
        .webp({ quality: v.quality, effort: 5, smartSubsample: true })
        .toBuffer()
      encoded.push(buf)
      digest.update(buf)
      total += buf.length
      if (i % 40 === 0) process.stdout.write(`  ${v.key} ${i}/${v.kept.length}\r`)
    }

    v.build = digest.digest('hex').slice(0, 10)
    const dir = path.join(OUT_DIR, v.dir, v.build)
    await fs.mkdir(dir, { recursive: true })
    for (let i = 0; i < encoded.length; i++) {
      await fs.writeFile(path.join(dir, `f${pad(i)}.webp`), encoded[i])
    }

    bytes[v.key] = total
    console.log(`  ${v.key}: ${v.kept.length} files, ${(total / 1048576).toFixed(1)} MB  -> /frames/${v.dir}/${v.build}/`)
  }

  // ---- stills + portraits ---------------------------------------------------
  // Stills keep readable filenames because they are referenced from the config
  // by name, so they carry their version as a query instead of a path segment.
  const stillDigest = createHash('sha1')
  const writeStill = async (pipeline, file) => {
    const buf = await pipeline.toBuffer()
    stillDigest.update(buf)
    await fs.writeFile(file, buf)
  }

  for (const s of STILLS) {
    await writeStill(
      sharp(srcPath(s.frame)).resize(1280, 720, { fit: 'fill' }).webp({ quality: 80, effort: 6 }),
      path.join(STILL_DIR, `${s.name}.webp`)
    )
  }
  for (const p of PORTRAITS) {
    await writeStill(
      sharp(srcPath(p.frame))
        .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
        .resize(672, 840, { fit: 'fill' })
        .webp({ quality: 84, effort: 6 }),
      path.join(STILL_DIR, `${p.name}.webp`)
    )
  }

  // The same stills cut from the portrait render, so a phone is never shown a
  // frame from the landscape one. See MOBILE_BAND for why these stay 16:9.
  const mobileVariant = VARIANTS.find((v) => v.key === 'mobile')
  if (mobileVariant) {
    const mobileSrc = srcPathFor(mobileVariant)
    await fs.mkdir(MOBILE_STILL_DIR, { recursive: true })
    for (const s of STILLS) {
      await writeStill(
        sharp(mobileSrc(s.frame)).extract(MOBILE_BAND).resize(1024, 576, { fit: 'fill' })
          .webp({ quality: 80, effort: 6 }),
        path.join(MOBILE_STILL_DIR, `${s.name}.webp`)
      )
    }
    for (const p of MOBILE_PORTRAITS) {
      await writeStill(
        sharp(mobileSrc(p.frame))
          .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
          .resize(672, 840, { fit: 'fill' }).webp({ quality: 84, effort: 6 }),
        path.join(MOBILE_STILL_DIR, `${p.name}.webp`)
      )
    }
    console.log(`mobile stills: ${STILLS.length} gallery + ${MOBILE_PORTRAITS.length} portraits`)
  }
  await fs.writeFile(
    path.join(ROOT, 'src', 'config', 'stills.generated.js'),
    `/* Generated by scripts/build-frames.mjs — do not edit by hand. */\n\n` +
      `/* Content version for the whole still set, appended as ?v= by <Still>.\n` +
      `   These filenames are readable and referenced from the wedding config, so\n` +
      `   they cannot carry a hash in the path the way the film frames do. */\n` +
      `export const stillsVersion = ${JSON.stringify(stillDigest.digest('hex').slice(0, 10))}\n\n` +
      `export const stills = ${JSON.stringify(
        STILLS.map((s) => ({ name: s.name, caption: s.caption, src: `/stills/${s.name}.webp` })),
        null,
        2
      )}\n`
  )
  console.log(`stills: ${STILLS.length} gallery + ${PORTRAITS.length} portraits`)
  if (STILLS_ONLY) return

  // ---- low quality image placeholder (instant first paint) ------------------
  // One per variant, from that variant's own render. A single shared
  // placeholder would have meant every phone downloading a thumbnail of the
  // landscape plate inside the manifest.
  const lqip = {}
  for (const v of VARIANTS) {
    const landscape = v.width >= v.height
    const w = landscape ? 32 : Math.round(32 * (v.width / v.height))
    const h = landscape ? Math.round(32 * (v.height / v.width)) : 32
    const buf = await sharp(srcPathFor(v)(v.kept[0]))
      .resize(w, h, { fit: 'fill' })
      .blur(1.4)
      .webp({ quality: 40 })
      .toBuffer()
    lqip[v.key] = `data:image/webp;base64,${buf.toString('base64')}`
  }

  // ---- manifest -------------------------------------------------------------
  const manifest = {
    generatedFrom: Object.fromEntries(VARIANTS.map((v) => [v.key, `${v.from}/`])),
    sourceCount: SOURCE_COUNT,
    /**
     * Everything that describes a render lives inside its own variant. The two
     * are separate exports, so they differ in shape (16:9 against 9:16), in
     * placeholder, and — since the second export — in which duplicate frames
     * they drop, which means `count` and `sourceToOut` cannot be shared either.
     *
     * sourceToOut[sourceFrameNumber] -> that variant's output frame index.
     */
    variants: Object.fromEntries(
      VARIANTS.map((v) => [
        v.key,
        {
          // Content-addressed: the hash changes only when the encoded frames
          // change, so a re-export can never be masked by a cached copy of the
          // previous one, and an unchanged variant keeps its URLs (and its
          // place in every visitor's cache) across rebuilds.
          path: `/frames/${v.dir}/${v.build}`,
          width: v.width,
          height: v.height,
          aspect: v.width / v.height,
          count: v.kept.length,
          sourceToOut: v.sourceToOut,
          lqip: lqip[v.key],
          bytes: bytes[v.key],
        },
      ])
    ),
    stills: STILLS.map((s) => ({ ...s, src: `/stills/${s.name}.webp` })),
  }
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest))

  // Human-readable mapping for the scene config, per variant since the two
  // exports no longer decimate alike.
  const marks = [1, 68, 69, 99, 100, 147, 148, 188, 189, 243, 244, 256, 257, 300]
  console.log('\nsource frame -> output index')
  console.log(`  ${'frame'.padStart(5)}  ${VARIANTS.map((v) => v.key.padStart(7)).join('')}`)
  for (const m of marks) {
    console.log(`  ${String(m).padStart(5)}  ${VARIANTS.map((v) => String(v.sourceToOut[m]).padStart(7)).join('')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
