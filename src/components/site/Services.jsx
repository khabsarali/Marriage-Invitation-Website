import { Reveal, Rule } from './primitives.jsx'
import { services } from '../../config/wedding.config.js'
import { navigate } from '../../lib/router.js'

/**
 * Two doors out of the invitation, and the only thing added to it.
 *
 * Makeup & hair and the shuttle are separate pages and are offered as two
 * separate buttons — one combined "guest services" link would hide one of them
 * behind the other. There is no heading over them beyond a tracked label: the
 * buttons say what they are, and inventing a paragraph to introduce them would
 * put copy on the invitation that nobody wrote.
 */
export default function Services() {
  return (
    <section className="section section--paper services" aria-label="Guest services">
      <div className="section__inner services__inner">
        <Reveal>
          <Rule />
        </Reveal>

        <Reveal as="p" className="eyebrow services__eyebrow" delay={80}>
          {services.eyebrow}
        </Reveal>

        <div className="services__row">
          {services.links.map((link, i) => (
            <Reveal key={link.to} delay={160 + i * 120}>
              <a
                className="btn btn--quiet services__btn"
                href={link.to}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(link.to)
                }}
              >
                {link.label}
                <span className="services__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
