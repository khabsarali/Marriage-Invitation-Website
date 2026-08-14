import { logo } from '../../config/wedding.config.js'

/**
 * The film's loader: holds the page still until enough of the sequence has
 * arrived to play it without stuttering.
 *
 * Not on the page today. With ENABLE_3D_EXPERIENCE off there is no film to wait
 * for, and the invitation opens behind Preloader.jsx instead — a much shorter
 * wait, for fonts and one image. Kept for when the film comes back; its styles
 * are the `.loader` block of src/styles/film.css, which this file deliberately
 * does not import, so nothing here reaches a normal visit.
 */
export default function StoryLoader({ progress, leaving, failed, onSkip }) {
  const percent = Math.round(progress * 100)

  return (
    <div className={`loader${leaving ? ' loader--leaving' : ''}`} role="status" aria-live="polite">
      <div className="loader__inner">
        {/* Eager and high priority: this is the only thing on screen while the
            film downloads, so it must not itself be waited for. */}
        <img
          className="loader__monogram"
          src={logo.mark}
          alt={logo.alt}
          width="420"
          height="392"
          fetchPriority="high"
        />

        <p className="loader__text">{failed ? 'Opening the invitation…' : 'Loading our story…'}</p>

        <div className="loader__bar" aria-hidden="true">
          <span className="loader__fill" style={{ transform: `scaleX(${failed ? 1 : progress})` }} />
        </div>

        <p className="loader__percent">{failed ? '' : `${percent}%`}</p>

        {progress > 0.35 && !failed && (
          <button type="button" className="loader__skip" onClick={onSkip}>
            Skip the film
          </button>
        )}
      </div>
    </div>
  )
}
