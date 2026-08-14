import { Reveal } from './primitives.jsx'
import { useCountdown, useParallax } from '../../lib/hooks.js'
import { countdown, weddingDate, stills } from '../../config/wedding.config.js'

/**
 * One countdown, four numerals, no ornament.
 *
 * The numerals are set in the display serif at a size nothing else on the page
 * uses, separated by hairlines rather than boxed into tiles. The date itself is
 * not printed here — it belongs to the cities section, and the note underneath
 * is enough to say which city comes first.
 *
 * The wash behind is the barat hall's chandelier light (scripts/build-stills.mjs),
 * held far back so the numerals stay the subject.
 */
const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

export default function Countdown({ reducedMotion }) {
  const time = useCountdown(weddingDate.iso)
  const washRef = useParallax({ from: -4, to: 4, disabled: reducedMotion })

  return (
    <section className="section section--ink until" aria-label="Countdown">
      <div className="until__wash" ref={washRef} aria-hidden="true">
        <img src={stills.chandeliers} alt="" loading="lazy" decoding="async" />
      </div>

      <div className="section__inner until__inner">
        <Reveal as="p" className="eyebrow eyebrow--on-dark">
          {time.passed ? countdown.today : countdown.eyebrow}
        </Reveal>

        <Reveal className="until__grid" delay={140}>
          {UNITS.map((unit) => (
            <div className="until__unit" key={unit.key}>
              <span className="until__value">{String(time[unit.key]).padStart(2, '0')}</span>
              <span className="until__label">{unit.label}</span>
            </div>
          ))}
        </Reveal>

        <Reveal as="p" className="until__note" delay={220}>
          {countdown.note}
        </Reveal>
      </div>
    </section>
  )
}
