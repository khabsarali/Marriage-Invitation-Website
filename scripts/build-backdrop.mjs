/**
 * The hero backdrop.
 *
 *   npm run backdrop
 *
 * Unlike the ambient plates in build-stills.mjs, this one is not derived from
 * the film: it is a supplied photograph of the two skylines together — Quaid's
 * mausoleum and the Empress Market clock tower on one side, the Burj and the
 * Burj Al Arab on the other, across one stretch of water. It is the picture the
 * hero's line "When Dubai Meets Karachi" is about, so it is used as given.
 *
 * Two crops are shipped because the composition is symmetrical about the centre
 * and a landscape file cropped to a phone would lose both skylines. The sources
 * are the two files in `public/Background`, authored per orientation.
 *
 * No blur and no grade here — unlike the median plates, this image is meant to
 * be read. The hero's own scrim is what holds the type off it.
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'public', 'Background')
const OUT = path.join(ROOT, 'public', 'backdrop')

const PLATES = [
  { name: 'hero-wide', from: 'Desktop Background.jpeg', width: 1600 },
  // 1080 covers a 360px viewport at 3x, which is the widest phone this is
  // asked to fill; the source is 1281 and upscaling it would only cost bytes.
  { name: 'hero-tall', from: 'Mobile Background.jpeg', width: 1080 },
]

async function main() {
  await fs.mkdir(OUT, { recursive: true })

  for (const plate of PLATES) {
    const file = path.join(OUT, `${plate.name}.webp`)
    await sharp(path.join(SRC, plate.from))
      .resize({ width: plate.width, withoutEnlargement: true, kernel: 'lanczos3' })
      .webp({ quality: 82, effort: 6 })
      .toFile(file)

    const { size } = await fs.stat(file)
    const meta = await sharp(file).metadata()
    console.log(
      `${plate.name}: ${plate.from} → ${meta.width}x${meta.height}, ${(size / 1024).toFixed(0)} kB`
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
