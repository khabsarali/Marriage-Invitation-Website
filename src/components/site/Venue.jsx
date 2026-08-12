import { Section, SectionHeading, Reveal } from './primitives.jsx'
import { primaryVenue, eventById, mapsUrl, mapsEmbedUrl } from '../../config/wedding.config.js'

export default function Venue() {
  const event = eventById(primaryVenue.eventId)
  if (!event) return null

  return (
    <Section id="venue" className="section--venue" label="Venue">
      <SectionHeading kicker="How to find us" title={primaryVenue.heading} />

      <div className="venue__layout">
        <Reveal className="venue__card">
          <p className="venue__event">{event.name}</p>
          <h3 className="venue__name">{event.venue}</h3>
          <address className="venue__address">{event.address}</address>

          <dl className="venue__meta">
            <div>
              <dt>Date</dt>
              <dd>
                {event.weekday}, {event.date}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{event.time}</dd>
            </div>
          </dl>

          {primaryVenue.note && <p className="venue__note">{primaryVenue.note}</p>}

          <a
            className="btn btn--solid"
            href={mapsUrl(event.mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn__icon">
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
            Get Directions
          </a>
        </Reveal>

        <Reveal className="venue__map" delay={120}>
          <iframe
            title={`Map to ${event.venue}`}
            src={mapsEmbedUrl(event.mapQuery)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </Reveal>
      </div>
    </Section>
  )
}
