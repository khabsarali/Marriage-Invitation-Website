import { Section, SectionHeading, Reveal } from './primitives.jsx'
import { events, mapsUrl } from '../../config/wedding.config.js'

function EventCard({ event, index }) {
  return (
    <Reveal as="article" className="event" delay={index * 110}>
      <div className="event__media">
        <img src={event.image} alt={`${event.name} — from the wedding film`} loading="lazy" decoding="async" width="1280" height="720" />
        <span className="event__badge">{event.name}</span>
      </div>

      <div className="event__body">
        <p className="event__tagline">{event.tagline}</p>

        <dl className="event__facts">
          <div className="event__fact">
            <dt>Date</dt>
            <dd>
              <time dateTime={event.dateISO}>{event.date}</time>
              <span className="event__weekday">{event.weekday}</span>
            </dd>
          </div>
          <div className="event__fact">
            <dt>Time</dt>
            <dd>{event.time}</dd>
          </div>
          <div className="event__fact">
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
          <div className="event__fact">
            <dt>Location</dt>
            <dd>{event.address}</dd>
          </div>
          {event.dress && (
            <div className="event__fact">
              <dt>Dress</dt>
              <dd>{event.dress}</dd>
            </div>
          )}
        </dl>

        <a
          className="btn btn--ghost event__map"
          href={mapsUrl(event.mapQuery)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
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
        intro="Every chapter of the film is an evening we would love you to be part of."
      />

      <div className="events__grid">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} index={i} />
        ))}
      </div>
    </Section>
  )
}
