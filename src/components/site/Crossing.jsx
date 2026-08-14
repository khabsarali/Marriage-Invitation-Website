import { Reveal, MaskLines, Rule } from './primitives.jsx'
import Skyline from './Skyline.jsx'
import { useParallax } from '../../lib/hooks.js'
import { cities, celebrations } from '../../config/wedding.config.js'

/**
 * Dubai and Karachi, once.
 *
 * This is the section the client's two requests collapse into: the visual
 * dialogue between the cities, and the location panel that lists where and
 * when. Splitting them would mean printing both date ranges twice, which is
 * exactly the repetition that made the old page tiring — so the two cities face
 * each other across one hairline here, and their dates appear nowhere else on
 * the site.
 */
function Panel({ city, reducedMotion, index }) {
  const artRef = useParallax({ from: index === 0 ? -6 : 6, to: index === 0 ? 6 : -6, disabled: reducedMotion })
  const day = city.startISO.slice(0, 10)

  return (
    <Reveal as="article" className="panel" delay={index * 160}>
      <h3 className="panel__name">{city.name}</h3>

      <div className="panel__art" ref={artRef}>
        {city.image ? (
          <img
            className="panel__photo"
            src={city.image}
            alt={city.imageAlt}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Skyline name={city.skyline} />
        )}
      </div>

      <p className="panel__dates">
        <time className="panel__days" dateTime={day}>
          {city.dates}
        </time>
        <span className="panel__month">
          {city.month} {city.year}
        </span>
      </p>
    </Reveal>
  )
}

export default function Crossing({ reducedMotion }) {
  return (
    <section className="section section--ivory crossing" id="celebrations" aria-label="The celebrations">
      <div className="section__inner">
        <Reveal as="p" className="eyebrow">
          {celebrations.eyebrow}
        </Reveal>

        <MaskLines
          as="h2"
          className="crossing__heading"
          lines={celebrations.headingLines}
          delay={120}
        />

        <div className="crossing__split">
          {cities.map((city, i) => (
            <Panel key={city.id} city={city} index={i} reducedMotion={reducedMotion} />
          ))}
        </div>

        <Reveal className="crossing__foot" delay={220}>
          <Rule tight />
          <p className="crossing__note">{celebrations.note}</p>
        </Reveal>
      </div>
    </section>
  )
}
