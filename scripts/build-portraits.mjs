/**
 * The two portraits for the couple section.
 *
 *   npm run portraits
 *
 * The supplied files do not pair: hers is 4:5, outdoors, chest-up; his is 3:4,
 * studio, seated full-length, and he is small in a wide room. Set side by side
 * as they came, they read as two photographs that happen to be next to each
 * other rather than as a couple.
 *
 * So both are cut to one frame — 4:5, upper body, head in the same third —
 * which is what makes them a pair. `crop` is the region of the source to keep,
 * in source pixels; hers is already the right proportion and is taken whole.
 * The grade is barely there: a little saturation off, so the green garden and
 * the brown studio wall meet somewhere in the middle on the dark ground they
 * sit on.
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'public', 'portraits')

/** The frame both are cut to. 4:5, and large enough for a 2x phone. */
const WIDTH = 720
const HEIGHT = 900

const PORTRAITS = [
  { name: 'radia', from: 'radia.webp', crop: null },
  // Taken from just above his head down to his lap — a little over a third of
  // the source. It has to be that tight: his head is only 210px in a 1448px
  // frame, and anything wider leaves him a smaller figure than she is. At this
  // size his head lands the same height, and in the same third, as hers.
  { name: 'umar', from: 'umar.jpeg', crop: { left: 260, top: 352, width: 570, height: 712 } },
]

async function main() {
  for (const portrait of PORTRAITS) {
    const pipeline = sharp(path.join(DIR, portrait.from))
    if (portrait.crop) pipeline.extract(portrait.crop)

    const file = path.join(DIR, `${portrait.name}-portrait.webp`)
    await pipeline
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top', kernel: 'lanczos3' })
      .modulate({ saturation: 0.92 })
      .webp({ quality: 82, effort: 6 })
      .toFile(file)

    const { size } = await fs.stat(file)
    console.log(`${portrait.name}: ${portrait.from} → ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(0)} kB`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
