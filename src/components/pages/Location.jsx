import { Actions, Detail, PageFooter, PageHeader, PinMark, Plate } from './parts.jsx'
import { cityById, mapsUrl, venues } from '../../config/wedding.config.js'

/**
 * Where — the two cities, and what is known about each.
 *
 * The dates are not typed here: they are read from `cities`, which is the one
 * place they are set. What this page adds is the venue, the address and the
 * hour, and none of those exist yet — so each says so, and the map button is
 * simply not rendered. A "View on map" that opens a search for nothing is
 * worse than no button, and a guessed venue would be worse than either.
 */
export default function Location() {
  return (
    <article className="page-view page-view--night">
      <div className="page-shell">
        <PageHeader eyebrow={venues.eyebrow} lines={venues.headingLines} intro={venues.intro} />

        <div className="plates">
          {venues.places.map((place, i) => {
            const city = cityById(place.cityId)
            return (
              <Plate
                key={place.cityId}
                city={city.name}
                kicker={`${city.month} ${city.year}`}
                dates={`${city.dates} ${city.month}`}
                delay={i * 140}
              >
                <dl className="details">
                  <Detail label="Venue" value={place.venue} />
                  <Detail label="Address" value={place.address} />
                  <Detail label="Time" value={place.time} />
                </dl>

                <Actions>
                  {place.mapQuery ? (
                    <a
                      className="btn btn--on-dark"
                      href={mapsUrl(place.mapQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PinMark />
                      View on map
                    </a>
                  ) : (
                    <p className="plate__pending">
                      <PinMark />
                      Map to follow with the formal invitation
                    </p>
                  )}
                </Actions>
              </Plate>
            )
          })}
        </div>

        <PageFooter current="/location" />
      </div>
    </article>
  )
}
