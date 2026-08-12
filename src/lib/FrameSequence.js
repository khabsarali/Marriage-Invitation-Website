/**
 * Streaming loader for the cinematic image sequence.
 *
 * Memory strategy — the sequence is 240 frames at 1280x720. Holding every frame
 * decoded would cost ~885 MB of RGBA, so we split it in two:
 *
 *   1. Compressed bytes (Blob) for every frame, kept for the whole session.
 *      That is only ~16 MB and makes re-scrubbing instant.
 *   2. Decoded ImageBitmaps for a bounded window that follows the playhead,
 *      plus a sparse set of anchors so a sudden jump always has something to
 *      show. Everything outside the window is closed and released.
 *
 * Network strategy — a coarse pass (every Nth frame + a dense run at the head)
 * lands first so the film can start, then the gaps fill in the background,
 * ordered by distance from the playhead with a forward bias.
 */

const IDLE = 0
const INFLIGHT = 1
const DONE = 2
const FAILED = 3

const pad = (n) => String(n).padStart(3, '0')

export class FrameSequence {
  /**
   * @param {object} opts
   * @param {string} opts.basePath      e.g. "/frames/desktop"
   * @param {number} opts.count
   * @param {number} opts.concurrency   parallel network requests
   * @param {number} opts.decodeBudget  max decoded bitmaps held at once
   * @param {number} opts.coarseStride
   * @param {number} opts.leadFrames
   */
  constructor({ basePath, count, concurrency, decodeBudget, coarseStride, leadFrames }) {
    this.basePath = basePath
    this.count = count
    this.concurrency = concurrency
    this.decodeBudget = Math.max(8, decodeBudget)
    this.coarseStride = coarseStride
    this.leadFrames = leadFrames

    this.blobs = new Array(count).fill(null)
    this.state = new Uint8Array(count) // IDLE | INFLIGHT | DONE | FAILED
    this.bitmaps = new Map() // index -> ImageBitmap
    this.decoding = new Set()

    /** Frames kept decoded regardless of the playhead, so jumps never go blank. */
    this.anchorStride = Math.max(8, Math.round(count / 16))
    this.anchors = new Set()
    for (let i = 0; i < count; i += this.anchorStride) this.anchors.add(i)
    this.anchors.add(count - 1)

    this.playhead = 0
    this.direction = 1
    this.inflight = 0
    this.loadedCount = 0
    this.destroyed = false

    this._controller = new AbortController()
    this._primeTargets = this._buildPrimeList()
    this._primeRemaining = new Set(this._primeTargets)
    this._primeResolve = null
    this._onProgress = null
    this._backgroundFill = false
  }

  /** Coarse pass: a dense run at the head, then every Nth frame across the film. */
  _buildPrimeList() {
    const list = []
    const seen = new Set()
    const push = (i) => {
      if (i >= 0 && i < this.count && !seen.has(i)) {
        seen.add(i)
        list.push(i)
      }
    }
    for (let i = 0; i < this.leadFrames; i++) push(i)
    for (let i = 0; i < this.count; i += this.coarseStride) push(i)
    push(this.count - 1)
    return list
  }

  get primeTotal() {
    return this._primeTargets.length
  }

  /** Resolves once the coarse pass has landed. Rejects only if destroyed. */
  prime(onProgress) {
    this._onProgress = onProgress
    return new Promise((resolve) => {
      this._primeResolve = resolve
      this._pumpNetwork()
    })
  }

  /** Kick off the fill-in pass for every remaining frame. */
  startBackgroundFill() {
    this._backgroundFill = true
    this._pumpNetwork()
  }

  setPlayhead(index, direction) {
    this.playhead = index
    if (direction) this.direction = direction >= 0 ? 1 : -1
    this._pumpDecode()
    if (this._backgroundFill) this._pumpNetwork()
  }

  /* ---------------------------------------------------------------- network */

  _nextNetworkTarget() {
    // Priority 1: anything still missing from the coarse pass, in order.
    for (const i of this._primeTargets) {
      if (this.state[i] === IDLE) return i
    }
    if (!this._backgroundFill) return -1

    // Priority 2: fill in around the playhead, biased in the scroll direction.
    let best = -1
    let bestScore = Infinity
    for (let i = 0; i < this.count; i++) {
      if (this.state[i] !== IDLE) continue
      const delta = i - this.playhead
      const ahead = delta * this.direction >= 0
      const score = Math.abs(delta) * (ahead ? 1 : 3)
      if (score < bestScore) {
        bestScore = score
        best = i
      }
    }
    return best
  }

  _pumpNetwork() {
    if (this.destroyed) return
    while (this.inflight < this.concurrency) {
      const i = this._nextNetworkTarget()
      if (i < 0) break
      this._fetch(i)
    }
  }

  async _fetch(index) {
    this.state[index] = INFLIGHT
    this.inflight++
    try {
      const res = await fetch(`${this.basePath}/f${pad(index)}.webp`, {
        signal: this._controller.signal,
        cache: 'force-cache',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.blobs[index] = await res.blob()
      this.state[index] = DONE
      this.loadedCount++
    } catch (err) {
      if (this.destroyed) return
      // A dropped frame must never break the film — mark it and move on.
      this.state[index] = FAILED
    } finally {
      this.inflight--
      if (this.destroyed) return

      if (this._primeRemaining.has(index)) {
        this._primeRemaining.delete(index)
        this._onProgress?.(1 - this._primeRemaining.size / this._primeTargets.length)
        if (this._primeRemaining.size === 0 && this._primeResolve) {
          const resolve = this._primeResolve
          this._primeResolve = null
          resolve()
        }
      }
      this._pumpDecode()
      this._pumpNetwork()
    }
  }

  /* ----------------------------------------------------------------- decode */

  _wantsDecoded(index) {
    if (this.anchors.has(index)) return true
    const delta = index - this.playhead
    const ahead = delta * this.direction >= 0
    // Reach further in the direction of travel than behind it.
    const reach = ahead ? this.decodeBudget * 0.62 : this.decodeBudget * 0.22
    return Math.abs(delta) <= reach
  }

  _pumpDecode() {
    if (this.destroyed) return

    const parallel = 3
    if (this.decoding.size < parallel) {
      // Decode outward from the playhead so the frame under the cursor wins.
      const reach = Math.ceil(this.decodeBudget * 0.62)
      for (let step = 0; step <= reach && this.decoding.size < parallel; step++) {
        for (const dir of step === 0 ? [0] : [this.direction, -this.direction]) {
          const i = this.playhead + step * dir
          if (i < 0 || i >= this.count) continue
          if (this.state[i] !== DONE) continue
          if (this.bitmaps.has(i) || this.decoding.has(i)) continue
          this._decode(i)
          if (this.decoding.size >= parallel) break
        }
      }
    }
    this._evict()
  }

  async _decode(index) {
    this.decoding.add(index)
    try {
      const bitmap = await createImageBitmap(this.blobs[index])
      if (this.destroyed) {
        bitmap.close?.()
        return
      }
      this.bitmaps.set(index, bitmap)
    } catch {
      this.state[index] = FAILED
    } finally {
      this.decoding.delete(index)
      if (!this.destroyed) this._pumpDecode()
    }
  }

  _evict() {
    if (this.bitmaps.size <= this.decodeBudget) return
    const victims = []
    for (const index of this.bitmaps.keys()) {
      if (this._wantsDecoded(index)) continue
      victims.push(index)
    }
    // Drop the ones furthest from the playhead first.
    victims.sort((a, b) => Math.abs(b - this.playhead) - Math.abs(a - this.playhead))
    for (const index of victims) {
      if (this.bitmaps.size <= this.decodeBudget) break
      this.bitmaps.get(index)?.close?.()
      this.bitmaps.delete(index)
    }
  }

  /* ------------------------------------------------------------------ query */

  /**
   * The best pair of decoded frames bracketing a (fractional) position.
   * Returns `{ a, b, mix }` where `a`/`b` are ImageBitmaps and `mix` blends
   * between them — so a frame that has not arrived yet dissolves smoothly
   * instead of stuttering. `b` is null when only one frame is available or the
   * two neighbours are too far apart to blend without ghosting.
   */
  sample(position) {
    const exact = Math.round(position)
    if (this.bitmaps.has(exact)) return { a: this.bitmaps.get(exact), b: null, mix: 0 }

    let lo = -1
    let hi = -1
    for (let d = 1; d < this.count; d++) {
      if (lo < 0) {
        const i = exact - d
        if (i >= 0 && this.bitmaps.has(i)) lo = i
        else if (i < 0) lo = -2
      }
      if (hi < 0) {
        const i = exact + d
        if (i < this.count && this.bitmaps.has(i)) hi = i
        else if (i >= this.count) hi = -2
      }
      if (lo !== -1 && hi !== -1) break
    }
    const hasLo = lo >= 0
    const hasHi = hi >= 0

    if (hasLo && hasHi) {
      const span = hi - lo
      if (span <= 8) {
        return {
          a: this.bitmaps.get(lo),
          b: this.bitmaps.get(hi),
          mix: (position - lo) / span,
        }
      }
      const nearest = position - lo <= hi - position ? lo : hi
      return { a: this.bitmaps.get(nearest), b: null, mix: 0 }
    }
    if (hasLo) return { a: this.bitmaps.get(lo), b: null, mix: 0 }
    if (hasHi) return { a: this.bitmaps.get(hi), b: null, mix: 0 }
    return null
  }

  get stats() {
    return {
      fetched: this.loadedCount,
      total: this.count,
      decoded: this.bitmaps.size,
    }
  }

  destroy() {
    this.destroyed = true
    this._controller.abort()
    for (const bitmap of this.bitmaps.values()) bitmap.close?.()
    this.bitmaps.clear()
    this.blobs.length = 0
    this._primeResolve?.()
    this._primeResolve = null
  }
}
