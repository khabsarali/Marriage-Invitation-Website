import { useEffect, useState } from 'react'
import { logo, preloader } from '../../config/wedding.config.js'

/**
 * The envelope.
 *
 * A dark ground, the gold monogram, a hairline that fills, one tracked line.
 * That is the whole thing — the point is the pause before the invitation opens,
 * not a progress report.
 *
 * What it actually waits for is short and real: the display fonts, and the one
 * image the hero paints with. Both usually land in a few hundred milliseconds,
 * so a floor holds the monogram on screen long enough to be seen, and a ceiling
 * makes sure a slow phone gets the invitation anyway. It never waits on the
 * film's frames — those are not fetched at all while the film is off.
 */

/** Long enough to register as a considered opening, short enough not to annoy. */
const FLOOR_MS = 1500
/** Whatever has not arrived by here can arrive behind the page. */
const CEILING_MS = 3600
/** Matches the fade in the stylesheet. */
const FADE_MS = 1000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fonts and the hero plate. Any failure resolves — none of it is worth a hang. */
function assets(heroSrc) {
  const jobs = []

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    jobs.push(document.fonts.ready.catch(() => {}))
  }

  if (heroSrc) {
    jobs.push(
      new Promise((resolve) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = resolve
        img.src = heroSrc
        // A cached image may already be complete before the handlers attach.
        if (img.complete) resolve()
      })
    )
  }

  return Promise.all(jobs)
}

export default function Preloader({ heroSrc, onDone }) {
  // 'holding' -> 'leaving' -> unmounted by the parent.
  const [state, setState] = useState('holding')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      await Promise.race([
        Promise.all([assets(heroSrc), wait(FLOOR_MS)]),
        wait(CEILING_MS),
      ])
      if (cancelled) return
      setState('leaving')
      await wait(FADE_MS)
      if (!cancelled) onDone()
    }

    run()
    return () => {
      cancelled = true
    }
  }, [heroSrc, onDone])

  return (
    <div
      className={`envelope${state === 'leaving' ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Opening the invitation"
    >
      <div className="envelope__inner">
        {/* Eager and high priority: it is the only thing on screen, so it must
            not itself be something the visitor waits for. */}
        <img
          className="envelope__mark"
          src={logo.mark}
          alt={logo.alt}
          width="420"
          height="392"
          fetchPriority="high"
          decoding="sync"
        />
        <span className="envelope__rule" aria-hidden="true">
          <i />
        </span>
        <p className="envelope__line">{preloader.line}</p>
      </div>
    </div>
  )
}
