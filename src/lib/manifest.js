import { SOURCE_COUNT } from '../config/scenes.config.js'

let cached = null

/**
 * Loads the frame manifest.
 *
 * Everything that describes a render lives inside its own variant, including
 * how many frames survived deduplication and which output frame each source
 * frame maps onto. The two renders are separate exports and drop different
 * duplicates, so there is no shared map to fall back on — `resolveVariant`
 * picks one and the film is driven entirely by that.
 */
export async function loadManifest() {
  if (cached) return cached

  const res = await fetch('/frames/manifest.json')
  if (!res.ok) throw new Error(`Could not load the frame manifest (HTTP ${res.status})`)
  cached = await res.json()
  return cached
}

/**
 * The chosen render, with the inverse of its own map derived — so the renderer
 * can go from the output frame it is showing back to the original frame number
 * the scene config is authored against.
 */
export function resolveVariant(manifest, key) {
  const variant = manifest.variants?.[key]
  if (!variant) {
    throw new Error(
      `The manifest has no "${key}" variant (found: ${Object.keys(manifest.variants ?? {}).join(', ') || 'none'}).`
    )
  }
  if (!Array.isArray(variant.sourceToOut) || !variant.count) {
    throw new Error(`The "${key}" variant is missing its frame map — re-run \`npm run frames\`.`)
  }

  const outToSource = new Array(variant.count).fill(1)
  for (let source = SOURCE_COUNT; source >= 1; source--) {
    outToSource[variant.sourceToOut[source]] = source
  }
  return { ...variant, key, outToSource }
}

/** Output frame index (may be fractional) -> original source frame number. */
export function toSourceFrame(variant, outIndex) {
  const clamped = Math.max(0, Math.min(variant.count - 1, outIndex))
  const lo = Math.floor(clamped)
  const hi = Math.min(variant.count - 1, lo + 1)
  const t = clamped - lo
  return variant.outToSource[lo] + (variant.outToSource[hi] - variant.outToSource[lo]) * t
}
