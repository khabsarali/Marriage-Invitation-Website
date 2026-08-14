import { Reveal, MaskLines } from './primitives.jsx'
import { events, eventsCopy, mapsUrl, tbc } from '../../config/wedding.config.js'

/**
 * The three evenings as an order of events, not as three cards.
 *
 * A card is a box that has to be decorated; a timeline is a line, a numeral and
 * a name, which is how a printed programme does it and is far quieter on the
 * page. Each evening carries the same three facts in the same three columns, so
 * the eye learns the pattern once and then only reads what changed.
 *
 * Nothing is invented: date, time and venue are all unset in the config, so all
 * three read "To be announced" rather than being left blank — a blank line reads
 * as a bug, and a guessed venue would be worse than either.
 */
const NUMERALS = ['I', 'II', 'III']

function Fact({ label, value, dateTime }) {
  const has = value !== null && value !== undefined && value !== ''
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd className={has ? undefined : 'is-pending'}>
        {has && dateTime ? <time dateTime={dateTime}>{value}</time> : has ? value : tbc.short}
      </dd>
    </div>
  )
}

export default function Events() {
  return (
    <section className="section section--paper events" id="events" aria-label="Order of events">
      <div className="section__inner">
        <Reveal as="p" className="eyebrow">
          {eventsCopy.eyebrow}
        </Reveal>
        <MaskLines as="h2" className="events__heading" lines={[eventsCopy.heading]} delay={100} />
        <Reveal as="p" className="events__intro" delay={200}>
          {eventsCopy.intro}
        </Reveal>

        <ol className="timeline">
          {events.map((event, i) => (
            <Reveal as="li" className="timeline__item" key={event.id} delay={i * 120}>
              <span className="timeline__node" aria-hidden="true" />

              <div className="timeline__head">
                <span className="timeline__numeral" aria-hidden="true">
                  {NUMERALS[i] ?? i + 1}
                </span>
                <h3 className="timeline__name">{event.name}</h3>
              </div>

              <p className="timeline__tagline">{event.tagline}</p>

              <dl className="timeline__facts">
                <Fact label="Date" value={event.date} dateTime={event.dateISO} />
                <Fact label="Time" value={event.time} />
                <Fact label="Venue" value={event.venue ?? event.city} />
              </dl>

              {event.dress && (
                <p className="timeline__dress">
                  <span>Dress</span> {event.dress}
                </p>
              )}

              {/* Only once a real venue exists — a maps link is never guessed. */}
              {event.mapQuery && (
                <a
                  className="link"
                  href={mapsUrl(event.mapQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
