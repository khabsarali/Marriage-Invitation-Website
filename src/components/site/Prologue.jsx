import { Reveal } from './primitives.jsx'
import CityPlate from './CityPlate.jsx'
import { announcement, cities, couple, coupleNames, invitation, logo, prologue } from '../../config/wedding.config.js'

/**
 * Everything before the film.
 *
 *   the three opening lines  ->  Dubai  ->  the crossing  ->  Karachi
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

      {/* ------------------------------------------------------------ Dubai */}
      <CityPlate city={dubai} reducedMotion={reducedMotion} eyebrow="The celebrations begin in" />

      {/* -------------------------------------------- Dubai -> Karachi ---- */}
      {/* The crossing between the two cities. A held line over a slow wash,
          so the move reads as one journey rather than two separate sections. */}
      <section className="crossing" aria-label="From Dubai to Karachi">
        <div className="crossing__wash" aria-hidden="true" />
        <Reveal as="p" className="crossing__line">
          <span>Dubai</span>
          <span className="crossing__arrow" aria-hidden="true" />
          <span>Karachi</span>
        </Reveal>
        <Reveal as="p" className="crossing__note" delay={220}>
          One celebration, across two cities and two years
        </Reveal>
      </section>

      {/* ---------------------------------------------------------- Karachi */}
      <CityPlate city={karachi} reducedMotion={reducedMotion} eyebrow="And continue in" />

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
      <section className="filmcue" aria-hidden="true">
        <Reveal as="p" className="filmcue__line">
          {prologue.filmCue}
        </Reveal>
      </section>
    </div>
  )
}
