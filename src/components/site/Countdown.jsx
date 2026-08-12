import { Section, Reveal, Ornament } from './primitives.jsx'
import { useCountdown } from '../../lib/hooks.js'
import { weddingDate, coupleNames } from '../../config/wedding.config.js'

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

export default function Countdown() {
  const time = useCountdown(weddingDate.iso)

  return (
    <Section id="countdown" className="section--countdown" label="Countdown">
      <Reveal as="p" className="countdown__kicker">
        {time.passed ? 'Today is the day' : 'Counting down to the celebration'}
      </Reveal>

      <Reveal delay={60}>
        <Ornament />
      </Reveal>

      <Reveal className="countdown__grid" delay={120}>
        {UNITS.map((unit) => (
          <div className="countdown__unit" key={unit.key}>
            <span className="countdown__value">{String(time[unit.key]).padStart(2, '0')}</span>
            <span className="countdown__label">{unit.label}</span>
          </div>
        ))}
      </Reveal>

      <Reveal as="p" className="countdown__note" delay={180}>
        {time.passed
          ? `${coupleNames[0]} & ${coupleNames[1]} are getting married today.`
          : `Until ${coupleNames[0]} & ${coupleNames[1]} say “I do” on ${weddingDate.day} ${weddingDate.month} ${weddingDate.year}.`}
      </Reveal>
    </Section>
  )
}
