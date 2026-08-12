import { couple } from '../../config/wedding.config.js'

/**
 * The first thing anyone sees. Holds the page still until enough of the film
 * has arrived to play it without stuttering.
 */
export default function StoryLoader({ progress, leaving, failed, onSkip }) {
  const percent = Math.round(progress * 100)

  return (
    <div className={`loader${leaving ? ' loader--leaving' : ''}`} role="status" aria-live="polite">
      <div className="loader__inner">
        <div className="loader__monogram" aria-hidden="true">
          <span>{couple[couple.order[0]].name.charAt(0)}</span>
          <span className="loader__amp">&amp;</span>
          <span>{couple[couple.order[1]].name.charAt(0)}</span>
        </div>

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
