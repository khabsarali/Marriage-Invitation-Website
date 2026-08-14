import { Section, SectionHeading, Reveal } from './primitives.jsx'
import { cities, events, mapsUrl, tbc } from '../../config/wedding.config.js'

/**
 * Where the celebrations happen. The wedding spans two cities, so this reads as
 * two panels rather than one venue with one map.
 *
 * No venue has been settled yet, so each panel names its city and dates and
 * holds space for the address. "Get directions" only appears once a `mapQuery`
 * exists on one of that city's events — a maps link is not invented, and a
 * button that leads nowhere is worse than no button.
 */
function CityPanel({ city, index }) {
  const cityEvents = events.filter((e) => e.city === city.id)
  const located = cityEvents.find((e) => e.mapQuery)

  return (
    <Reveal as="article" className="venue__panel" delay={index * 140}>
      <p className="venue__eyebrow">{index === 0 ? 'First' : 'Then'}</p>
      <h3 className="venue__city">{city.name}</h3>

      <p className="venue__when">
        {city.dates} {city.month} <span>{city.year}</span>
      </p>

      <span className="venue__hair" aria-hidden="true" />

      {located ? (
        <>
          <p className="venue__place">{located.venue}</p>
          <p className="venue__address">{located.address}</p>
          <a
            className="btn btn--ghost venue__directions"
            href={mapsUrl(located.mapQuery)}
            target="_blank"
            rel="noreferrer noopener"
          >
            Get directions
          </a>
        </>
      ) : (
        <p className="venue__pending">{tbc.short}</p>
      )}
    </Reveal>
  )
}

export default function Venue() {
  return (
    <Section id="venue" className="section--venue" label="The venues">
      <SectionHeading
        kicker="Where"
        title="Two Cities"
        intro="The celebrations open in Dubai and continue in Karachi. Venues will be shared with the formal invitation."
      />

      <div className="venue__grid">
        {cities.map((city, i) => (
          <CityPanel key={city.id} city={city} index={i} />
        ))}
      </div>
    </Section>
  )
}
