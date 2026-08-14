import { Reveal, Ornament } from './primitives.jsx'
import { coupleNames, invitation, weddingDate, logo, announcement, site } from '../../config/wedding.config.js'

export default function Hero() {
  return (
    <section className="hero" id="invitation" aria-label="The invitation">
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__inner">
        {/* The mark alone, not the full lockup — the names are set below it
            in type, and printing them twice would read as a mistake. */}
        <Reveal>
          <img className="hero__mark" src={logo.mark} alt={logo.alt} width="640" height="597" />
        </Reveal>

        <Reveal as="p" className="hero__bismillah" delay={60}>
          {invitation.blessing}
        </Reveal>

        <Reveal as="p" className="hero__hosts" delay={80}>
          {announcement.hosts}
        </Reveal>
        <Reveal as="p" className="hero__kicker" delay={120}>
          {announcement.lead} <em>{announcement.heading}</em> {announcement.relation.toLowerCase()}
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

        <Reveal as="p" className="hero__followup" delay={400}>
          {site.followUp}
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
