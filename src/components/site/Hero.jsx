import { Reveal, Ornament } from './primitives.jsx'
import { coupleNames, invitation, weddingDate, couple } from '../../config/wedding.config.js'

export default function Hero() {
  return (
    <section className="hero" id="invitation" aria-label="The invitation">
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__inner">
        <Reveal as="p" className="hero__bismillah">
          {invitation.blessing}
        </Reveal>

        <Reveal as="p" className="hero__kicker" delay={80}>
          {invitation.kicker}
        </Reveal>

        <Reveal className="hero__names" delay={140}>
          <h1>
            <span className="hero__name">{coupleNames[0]}</span>
            <span className="hero__amp">&amp;</span>
            <span className="hero__name">{coupleNames[1]}</span>
          </h1>
        </Reveal>

        <Reveal delay={220}>
          <Ornament className="ornament--wide" />
        </Reveal>

        <Reveal as="p" className="hero__request" delay={260}>
          {invitation.request}
        </Reveal>

        <Reveal className="hero__date" delay={320}>
          <span className="hero__weekday">{weddingDate.weekday}</span>
          <span className="hero__daterow">
            <span className="hero__day">{weddingDate.day}</span>
            <span className="hero__rule" aria-hidden="true" />
            <span className="hero__monthyear">
              <span>{weddingDate.month}</span>
              <span>{weddingDate.year}</span>
            </span>
          </span>
        </Reveal>

        <Reveal as="p" className="hero__hashtag" delay={400}>
          {couple.hashtag}
        </Reveal>
      </div>

      <figure className="hero__verse">
        <Reveal as="blockquote" className="hero__verse-text">
          {invitation.verse}
        </Reveal>
        <Reveal as="figcaption" className="hero__verse-source" delay={80}>
          {invitation.verseSource}
        </Reveal>
      </figure>
    </section>
  )
}
