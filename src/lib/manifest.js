import { SOURCE_COUNT } from '../config/scenes.config.js'

let cached = null

/**
 * Loads the frame manifest and derives the inverse of its `sourceToOut` map,
 * so the renderer can go from the output frame it is showing back to the
 * original frame number the scene config is authored against.
 */
export async function loadManifest() {
  if (cached) return cached

  const res = await fetch('/frames/manifest.json')
  if (!res.ok) throw new Error(`Could not load the frame manifest (HTTP ${res.status})`)
  const manifest = await res.json()

  const outToSource = new Array(manifest.count).fill(1)
  for (let source = SOURCE_COUNT; source >= 1; source--) {
    outToSource[manifest.sourceToOut[source]] = source
  }

  cached = { ...manifest, outToSource }
  return cached
}

/** Output frame index (may be fractional) -> original source frame number. */
export function toSourceFrame(manifest, outIndex) {
  const clamped = Math.max(0, Math.min(manifest.count - 1, outIndex))
  const lo = Math.floor(clamped)
  const hi = Math.min(manifest.count - 1, lo + 1)
  const t = clamped - lo
  return manifest.outToSource[lo] + (manifest.outToSource[hi] - manifest.outToSource[lo]) * t
}
