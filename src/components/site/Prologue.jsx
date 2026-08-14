import { Reveal } from './primitives.jsx'
import { announcement, cities, couple, coupleNames, invitation, logo, prologue } from '../../config/wedding.config.js'
import { ENABLE_3D_EXPERIENCE } from '../../config/scenes.config.js'

/**
 * Everything before the film.
 *
 *   the three opening lines  ->  the two cities and their dates
 *   ->  the announcement  ->  the couple  ->  the cue into the film
 *
 * Deliberately built from the same `Reveal` the invitation already uses, so the
 * prologue inherits the site's one motion language instead of introducing a
 * second. Each line carries its own delay so it lands on its own rather than
 * the block arriving at once.
 *
 * This sits above the film in the page and touches nothing inside it.
 */
export default function Prologue({ reducedMotion }) {
  const [dubai, karachi] = cities

  return (
    <div className="prologue">
      {/* ---------------------------------------------------- the opening */}
      <section className="overture" aria-label="A royal celebration of love">
        <Reveal>
          <img className="overture__mark" src={logo.mark} alt={logo.alt} width="640" height="597" />
        </Reveal>

        <p className="overture__bismillah">{invitation.blessing}</p>

        <div className="overture__lines">
          {prologue.lines.map((line, i) => (
            <Reveal
              as="p"
              key={line}
              className={`overture__line overture__line--${i + 1}`}
              delay={260 + i * 420}
            >
              {line}
            </Reveal>
          ))}
        </div>

        <Reveal as="p" className="overture__hint" delay={1500}>
          Scroll
        </Reveal>
      </section>

      {/* ------------------------------------------- the two cities, briefly */}
      {/* The full-height Dubai and Karachi plates are gone. They were the only
          place the date ranges appeared, so the dates moved here rather than
          off the site — one band carrying both cities and both ranges. */}
      <section className="crossing" aria-label="Dubai and Karachi">
        <div className="crossing__wash" aria-hidden="true" />

        <div className="crossing__cities">
          {[dubai, karachi].map((city, i) => (
            <Reveal as="p" className="crossing__city" key={city.id} delay={i * 220}>
              <span className="crossing__cityname">{city.name}</span>
              <span className="crossing__citydates">
                {city.dates} {city.month} <span>{city.year}</span>
              </span>
            </Reveal>
          ))}
        </div>

        <Reveal as="p" className="crossing__note" delay={460}>
          One celebration, across two cities and two years
        </Reveal>
      </section>

      {/* ----------------------------------------------------- announcement */}
      <section className="announce" aria-label="The announcement">
        <Reveal as="p" className="announce__hosts">
          {announcement.hosts}
        </Reveal>
        <Reveal as="p" className="announce__lead" delay={160}>
          {announcement.lead}
        </Reveal>
        <Reveal as="h2" className="announce__heading" delay={280}>
          {announcement.heading}
        </Reveal>
        <Reveal as="p" className="announce__relation" delay={420}>
          {announcement.relation}
        </Reveal>
      </section>

      {/* ------------------------------------------------------- the couple */}
      <section className="reveal-couple" aria-label={`${coupleNames[0]} with ${coupleNames[1]}`}>
        <Reveal as="p" className="reveal-couple__name" delay={80}>
          {coupleNames[0]}
        </Reveal>
        <Reveal as="p" className="reveal-couple__joiner" delay={520}>
          {couple.joiner}
        </Reveal>
        <Reveal as="p" className="reveal-couple__name" delay={900}>
          {coupleNames[1]}
        </Reveal>
      </section>

      {/* --------------------------------------------------- into the film */}
      {/* This section exists to hand over to the film, and it fades the ivory
          ground down to the film's black to do it. With the film off there is
          nothing to hand over to, and the gradient would read as a black band
          across the page — so it goes with the film. */}
      {ENABLE_3D_EXPERIENCE && (
        <section className="filmcue" aria-hidden="true">
          <Reveal as="p" className="filmcue__line">
            {prologue.filmCue}
          </Reveal>
        </section>
      )}
    </div>
  )
}
