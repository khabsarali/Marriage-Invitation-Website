import { Actions, Detail, PageFooter, PageHeader, Plate } from './parts.jsx'
import { cityById, stay } from '../../config/wedding.config.js'

/**
 * Your stay — one plate per city, each carrying the same six details in the
 * same order.
 *
 * Nothing is invented. Every field in `stay.hotels` is null until the family
 * has actually held rooms, so each line reads "To be announced" and the buttons
 * are absent rather than dead. Fill a hotel in and the page fills in with it.
 *
 * The couple's portraits are not on this page, and are not meant to be: they
 * belong to the invitation.
 */
export default function Booking() {
  return (
    <article className="page-view page-view--night">
      <div className="page-shell">
        <PageHeader eyebrow={stay.eyebrow} lines={stay.headingLines} intro={stay.intro} />

        <div className="plates">
          {stay.hotels.map((hotel, i) => {
            const city = cityById(hotel.cityId)
            return (
              <Plate
                key={hotel.cityId}
                city={city.name}
                kicker={`Your stay in ${city.name}`}
                dates={`${city.dates} ${city.month} ${city.year}`}
                delay={i * 140}
              >
                <dl className="details">
                  <Detail label="Hotel" value={hotel.name} />
                  <Detail label="Address" value={hotel.address} />
                  <Detail label="Check in" value={hotel.checkIn} />
                  <Detail label="Check out" value={hotel.checkOut} />
                  <Detail label="Rooms" value={hotel.rooms} />
                  <Detail label="From the venue" value={hotel.distance} />
                </dl>

                <Actions>
                  {hotel.bookingUrl && (
                    <a
                      className="btn btn--on-dark"
                      href={hotel.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Book a room
                    </a>
                  )}
                  {hotel.phone && (
                    <a className="btn btn--quiet btn--on-dark" href={`tel:${hotel.phone.replace(/\s+/g, '')}`}>
                      Call the hotel
                    </a>
                  )}
                </Actions>
              </Plate>
            )
          })}
        </div>

        <PageFooter current="/booking" />
      </div>
    </article>
  )
}
