/**
 * The film's score.
 *
 * Web Audio rather than an <audio> element, for two reasons. The track is
 * about half a minute against a film that runs longer, so it has to loop, and
 * an HTMLMediaElement loop leaves an audible gap at the seam where an
 * AudioBufferSourceNode does not. And a GainNode gives real fades in and out
 * of the invitation instead of a hard cut.
 *
 * No browser will start audio before the guest has interacted with the page,
 * and scrolling does not count — only pointer, touch and key events grant
 * activation. So nothing is created until the first such gesture arrives, and
 * the score then joins the film wherever it has got to. If it never arrives,
 * or the file cannot be decoded, the film simply plays silent.
 */
export class FilmAudio {
  constructor({ src, volume = 0.5, fadeIn = 2.2, fadeOut = 1.4 }) {
    this.src = src
    this.volume = volume
    this.fadeIn = fadeIn
    this.fadeOut = fadeOut

    this.ctx = null
    this.buffer = null
    this.source = null
    this.gain = null

    this.wanted = false // the film wants the score running
    this.muted = false
    this.hidden = false
    this.armed = false
    this.destroyed = false
  }

  static get supported() {
    return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext)
  }

  /**
   * Call from a real user gesture. Safe to call more than once.
   * Resolves true once the score is decoded and able to sound.
   */
  async arm() {
    if (this.destroyed || !FilmAudio.supported) return false
    if (this.armed) return !!this.buffer
    this.armed = true

    const Ctx = window.AudioContext || window.webkitAudioContext
    this.ctx = new Ctx()
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 0
    this.gain.connect(this.ctx.destination)

    try {
      const response = await fetch(this.src)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      // Safari still wants the callback form, so wrap it rather than awaiting.
      const bytes = await response.arrayBuffer()
      this.buffer = await new Promise((resolve, reject) =>
        this.ctx.decodeAudioData(bytes, resolve, reject)
      )
    } catch (err) {
      console.warn('[invitation] the score could not be loaded', err)
      this.armed = false
      return false
    }

    if (this.destroyed) return false
    if (this.wanted) this.play()
    return true
  }

  play() {
    this.wanted = true
    if (!this.buffer || this.destroyed || this.muted || this.hidden) return

    this.ctx.resume?.()
    if (!this.source) {
      const source = this.ctx.createBufferSource()
      source.buffer = this.buffer
      source.loop = true
      source.connect(this.gain)
      source.start()
      this.source = source
    }
    this.#ramp(this.volume, this.fadeIn)
  }

  /** Fade out and release the source; `play()` starts a fresh one. */
  stop() {
    this.wanted = false
    this.#release(this.fadeOut)
  }

  setMuted(muted) {
    if (this.muted === muted) return
    this.muted = muted
    // Drop the source rather than idling at zero gain, so a muted guest is not
    // paying for a decode loop for the length of the film.
    if (muted) this.#release(0.3)
    else if (this.wanted) this.play()
  }

  /** Background tabs should be silent, but keep the guest's place. */
  setHidden(hidden) {
    if (this.hidden === hidden) return
    this.hidden = hidden
    if (hidden) this.ctx?.suspend?.()
    else if (this.wanted && !this.muted) {
      this.ctx?.resume?.()
      this.play()
    }
  }

  destroy() {
    this.destroyed = true
    this.#release(0)
    this.ctx?.close?.()
    this.ctx = null
    this.buffer = null
  }

  #ramp(to, seconds) {
    if (!this.gain || !this.ctx) return
    const now = this.ctx.currentTime
    const gain = this.gain.gain
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    if (seconds > 0) gain.linearRampToValueAtTime(to, now + seconds)
    else gain.setValueAtTime(to, now)
  }

  #release(seconds) {
    const source = this.source
    if (!source) return
    this.source = null
    this.#ramp(0, seconds)
    const kill = () => {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      source.disconnect()
    }
    if (seconds > 0) setTimeout(kill, seconds * 1000 + 90)
    else kill()
  }
}
