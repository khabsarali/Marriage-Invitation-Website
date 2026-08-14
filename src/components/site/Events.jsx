import { Section, SectionHeading, Reveal, Still } from './primitives.jsx'
import { events, mapsUrl, tbc } from '../../config/wedding.config.js'

/**
 * One fact. Dates, times and venues are not settled yet, so an absent value
 * renders as the placeholder rather than as an empty line — a blank `dd` reads
 * as a bug, and a guessed value would be worse than either.
 */
function Fact({ label, children, value }) {
  const has = value !== null && value !== undefined && value !== ''
  return (
    <div className="event__fact">
      <dt>{label}</dt>
      <dd className={has ? undefined : 'event__fact--pending'}>{has ? children : tbc.short}</dd>
    </div>
  )
}

function EventCard({ event, index }) {
  return (
    <Reveal as="article" className="event" delay={index * 110}>
      <div className="event__media">
        <Still src={event.image} alt={`${event.name} — from the wedding film`} width="1280" height="720" />
        <span className="event__badge">{event.name}</span>
      </div>

      <div className="event__body">
        <p className="event__tagline">{event.tagline}</p>

        <dl className="event__facts">
          <Fact label="Date" value={event.date}>
            <time dateTime={event.dateISO ?? undefined}>{event.date}</time>
          </Fact>
          <Fact label="Time" value={event.time}>{event.time}</Fact>
          <Fact label="Venue" value={event.venue}>{event.venue}</Fact>
          <Fact label="Location" value={event.address}>{event.address}</Fact>
          {event.dress && (
            <div className="event__fact">
              <dt>Dress</dt>
              <dd>{event.dress}</dd>
            </div>
          )}
        </dl>

        {/* Only once a real venue exists — a maps link is never guessed. */}
        {event.mapQuery && (
          <a
            className="btn btn--ghost event__map"
            href={mapsUrl(event.mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
          </a>
        )}
      </div>
    </Reveal>
  )
}

export default function Events() {
  return (
    <Section id="events" className="section--events" label="Wedding events">
      <SectionHeading
        kicker="Three evenings"
        title="The Celebrations"
        intro="Every chapter of the film is an evening we would love you to be part of. Dates and venues follow with the formal invitation."
      />

      <div className="events__grid">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} index={i} />
        ))}
      </div>
    </Section>
  )
}
