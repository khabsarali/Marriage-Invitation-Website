/**
 * The two portraits for the couple section.
 *
 *   npm run portraits
 *
 * The supplied files do not pair: hers is 4:5, outdoors, chest-up; his is 3:4,
 * studio, three-quarter length. Set side by side as they came, they read as two
 * photographs that happen to be next to each other rather than as a couple.
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
  // Taken from the top of his head down to the waist, centred on him rather
  // than on the frame — he stands right of centre in the source.
  { name: 'umar', from: 'umar.jpeg', crop: { left: 200, top: 170, width: 760, height: 950 } },
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
