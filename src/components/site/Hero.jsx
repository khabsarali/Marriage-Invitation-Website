import { Reveal, Rule } from './primitives.jsx'
import { useParallax, useReveal } from '../../lib/hooks.js'
import { coupleNames, couple, hero, invitation } from '../../config/wedding.config.js'

/**
 * The hero, and the one place the names are set at full scale.
 *
 * Hierarchy is the whole design here: a small tracked eyebrow, the names as
 * large as the screen will carry them, then two quiet supporting lines. No
 * date, no hosts, no venue — those each have a section of their own further
 * down, and printing them here as well is what made the old page feel like a
 * template.
 *
 * The plate behind is the supplied photograph of the two skylines across one
 * stretch of water (see scripts/build-backdrop.mjs) — the picture the line
 * "When Dubai Meets Karachi" is about. It drifts on scroll and pushes in very
 * slowly; both stop under `prefers-reduced-motion`.
 */
export default function Hero({ reducedMotion }) {
  const plateRef = useParallax({ from: -3.5, to: 3.5, disabled: reducedMotion })
  const [namesRef, namesIn] = useReveal({ threshold: 0.2 })

  return (
    <section className="hero" id="invitation" aria-label="Radia and Umar">
      <div className="hero__plate" ref={plateRef}>
        <picture>
          {/* A tall screen gets the portrait crop rather than the middle
              quarter of the landscape one — the composition is symmetrical
              about the water, so cropping the wide file would cut both
              skylines away. */}
          <source media="(orientation: portrait)" srcSet={hero.backdrop.tall} />
          <img
            src={hero.backdrop.wide}
            alt={hero.backdrop.alt}
            className="hero__image"
            width="1600"
            height="900"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
      <div className="hero__scrim" aria-hidden="true" />

      <div className="hero__copy">
        <Reveal as="p" className="hero__blessing" delay={120} lang="ar" dir="rtl">
          {invitation.blessing}
        </Reveal>

        <Reveal as="p" className="hero__eyebrow" delay={260}>
          {hero.eyebrow}
        </Reveal>

        <h1
          className={`hero__names masked${namesIn ? ' is-visible' : ''}`}
          ref={namesRef}
          aria-label={`${coupleNames[0]} and ${coupleNames[1]}`}
        >
          <span className="masked__line">
            <span className="masked__inner" style={{ transitionDelay: '380ms' }}>
              {coupleNames[0]}
            </span>
          </span>
          <span className="masked__line hero__amp" aria-hidden="true">
            <span className="masked__inner" style={{ transitionDelay: '520ms' }}>
              &amp;
            </span>
          </span>
          <span className="masked__line">
            <span className="masked__inner" style={{ transitionDelay: '620ms' }}>
              {coupleNames[1]}
            </span>
          </span>
        </h1>

        <Reveal delay={860}>
          <Rule className="rule--on-dark" />
        </Reveal>

        <Reveal as="p" className="hero__destiny" delay={960}>
          {hero.destiny}
        </Reveal>
        <Reveal as="p" className="hero__crossing" delay={1060}>
          {hero.crossing}
        </Reveal>
      </div>

      {/* Not a Reveal: this one is absolutely positioned and centred with a
          transform of its own, which a Reveal's transform would fight. It fades
          in on a delay instead. */}
      <div className="hero__cue">
        <span className="hero__cue-line" aria-hidden="true" />
        <span className="hero__cue-label">{hero.scrollCue}</span>
      </div>

      {/* Not rendered, and not a placeholder: it exists so a screen reader and a
          search result get the couple named properly under the display type. */}
      <span className="visually-hidden">
        {couple.bride.fullName} {couple.joiner} {couple.groom.fullName}
      </span>
    </section>
  )
}
