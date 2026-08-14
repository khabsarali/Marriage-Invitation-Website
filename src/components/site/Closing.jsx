import { Reveal, MaskLines, Rule } from './primitives.jsx'
import { useParallax } from '../../lib/hooks.js'
import { closing, coupleNames, logo, social, stills } from '../../config/wedding.config.js'

/**
 * The back of the card.
 *
 * The names once more — the only repeat on the site, and the one that earns it,
 * because a closing page that does not sign off is not a closing page. Then who
 * it is from, and that the formal invitation follows. No dates, no venues, no
 * second countdown: everything else has already been said.
 *
 * The wash is the walima room's roses, held right back (scripts/build-stills.mjs).
 */
function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="closing__social-mark" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Closing({ reducedMotion }) {
  const washRef = useParallax({ from: -3, to: 3, disabled: reducedMotion })

  return (
    <footer className="closing" aria-label="With love from the family">
      <div className="closing__wash" ref={washRef} aria-hidden="true">
        <img src={stills.roses} alt="" loading="lazy" decoding="async" />
      </div>

      <div className="closing__inner">
        <Reveal>
          <img
            className="closing__mark"
            src={logo.mark}
            alt={logo.alt}
            width="420"
            height="392"
            loading="lazy"
            decoding="async"
          />
        </Reveal>

        <MaskLines
          as="p"
          className="closing__names"
          lines={[`${coupleNames[0]} & ${coupleNames[1]}`]}
          delay={140}
        />

        <Reveal delay={320}>
          <Rule className="rule--on-dark" tight />
        </Reveal>

        <Reveal as="p" className="closing__salutation" delay={400}>
          {closing.salutation}
        </Reveal>
        <Reveal as="p" className="closing__family" delay={480}>
          {closing.family}
        </Reveal>
        <Reveal as="p" className="closing__followup" delay={560}>
          {closing.followUp}
        </Reveal>

        {social.instagram && (
          <Reveal delay={640}>
            <a
              className="closing__social"
              href={social.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramMark />
              <span>{social.instagram.handle}</span>
            </a>
          </Reveal>
        )}
      </div>
    </footer>
  )
}
