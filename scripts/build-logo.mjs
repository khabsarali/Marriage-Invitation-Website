/**
 * Monogram pipeline.
 *
 * Source: brand/monogram.jpg — the gold RU monogram with the names set
 * beneath it, flat on a near-white card.
 *
 * The site puts this mark on ivory in the invitation and on near-black behind
 * the film, so a white card behind it would read as a box in both places. The
 * white is keyed out to real alpha here, once, rather than being fought with
 * CSS blend modes at runtime.
 *
 * Emits the full lockup, the monogram on its own (the names are already set in
 * the page, so the nav and loader want the mark alone), and the favicons.
 *
 *   npm run logo
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'brand', 'monogram.jpg')
const OUT = path.join(ROOT, 'public', 'brand')

/** The ink behind the favicon, matching the theme-color in index.html. */
const INK = { r: 13, g: 11, b: 10 }

/**
 * Alpha from distance to the card colour.
 *
 * Deliberately not the usual "alpha = 1 - luminance" key: that makes the pale
 * highlights running through the gold semi-transparent, which then go muddy
 * over the dark backdrop. Keying on distance instead keeps every pixel of the
 * mark at its true colour and full opacity, and only softens the last few
 * levels at the edge, so the gold survives on either background.
 *
 * The ramp starts well clear of 0 because the source is a JPEG and the ringing
 * around the strokes would otherwise key in as a faint halo.
 */
const KEY_LOW = 12 // at or under this distance from the card: fully transparent
const KEY_HIGH = 38 // at or over: fully opaque

async function keyed() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // The card colour, read from a corner rather than assumed to be pure white.
  const card = { r: data[0], g: data[1], b: data[2] }

  const out = Buffer.alloc(width * height * 4)
  for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const distance = Math.max(Math.abs(r - card.r), Math.abs(g - card.g), Math.abs(b - card.b))
    let a = (distance - KEY_LOW) / (KEY_HIGH - KEY_LOW)
    a = a < 0 ? 0 : a > 1 ? 1 : a
    out[o] = r
    out[o + 1] = g
    out[o + 2] = b
    out[o + 3] = Math.round(a * 255)
  }
  return { buffer: out, width, height, card }
}

/** Rows carrying any ink, used to trim and to find the gap under the monogram. */
function rowInk(buffer, width, height) {
  const rows = new Array(height).fill(0)
  for (let y = 0; y < height; y++) {
    let sum = 0
    for (let x = 0; x < width; x++) sum += buffer[(y * width + x) * 4 + 3]
    rows[y] = sum
  }
  return rows
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })

  const { buffer, width, height, card } = await keyed()
  const raw = { raw: { width, height, channels: 4 } }
  console.log(`source ${width}x${height}, card colour rgb(${card.r}, ${card.g}, ${card.b})`)

  // ---- full lockup ----------------------------------------------------------
  const full = await sharp(buffer, raw).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true })
  console.log(`full lockup trimmed to ${full.info.width}x${full.info.height}`)
  await sharp(full.data, { raw: { width: full.info.width, height: full.info.height, channels: 4 } })
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(path.join(OUT, 'logo.webp'))

  // ---- the monogram on its own ---------------------------------------------
  // The lockup is [monogram] gap [names] gap [rule]. Split on the first run of
  // blank rows after the monogram rather than at a hardcoded fraction, so a
  // redrawn logo with different proportions still cuts in the right place.
  const rows = rowInk(full.data, full.info.width, full.info.height)
  const blank = rows.map((v) => v < full.info.width * 2)
  const minGap = Math.round(full.info.height * 0.02)

  let cut = full.info.height
  let run = 0
  for (let y = 0; y < blank.length; y++) {
    if (blank[y]) {
      run++
      // Only interested in a gap that follows real content, and the monogram
      // is the tallest mass, so ignore anything in the top third.
      if (run >= minGap && y > full.info.height * 0.33) {
        cut = y - run + 1
        break
      }
    } else {
      run = 0
    }
  }
  console.log(`monogram cut at y=${cut} of ${full.info.height}`)

  const mark = await sharp(full.data, {
    raw: { width: full.info.width, height: full.info.height, channels: 4 },
  })
    .extract({ left: 0, top: 0, width: full.info.width, height: cut })
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true })

  await sharp(mark.data, { raw: { width: mark.info.width, height: mark.info.height, channels: 4 } })
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(path.join(OUT, 'mark.webp'))
  console.log(`mark ${mark.info.width}x${mark.info.height}`)

  // ---- favicons -------------------------------------------------------------
  // On the ink, not transparent: a thin gold monogram on whatever the browser
  // puts behind a tab is unreadable, and the dark tile matches the theme colour.
  for (const size of [32, 180]) {
    const inset = Math.round(size * 0.16)
    const glyph = await sharp(mark.data, {
      raw: { width: mark.info.width, height: mark.info.height, channels: 4 },
    })
      .resize({ width: size - inset * 2, height: size - inset * 2, fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } })
      // composite() needs an encoded image, not the raw pixels resize returns.
      .png()
      .toBuffer()

    await sharp({
      create: { width: size, height: size, channels: 4, background: { ...INK, alpha: 1 } },
    })
      .composite([{ input: glyph, gravity: 'center' }])
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`))
  }
  console.log('favicons: icon-32.png, icon-180.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
