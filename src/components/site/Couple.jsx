import { Section, SectionHeading, Reveal } from './primitives.jsx'
import { couple } from '../../config/wedding.config.js'

const ROLES = { bride: 'The Bride', groom: 'The Groom' }

function Portrait({ personKey, index }) {
  const person = couple[personKey]
  return (
    <Reveal as="article" className="person" delay={index * 140}>
      <div className="person__frame">
        <img
          src={person.image}
          alt={person.fullName}
          loading="lazy"
          decoding="async"
          width="672"
          height="840"
        />
      </div>
      <p className="person__role">{ROLES[personKey]}</p>
      <h3 className="person__name">{person.fullName}</h3>
      {person.parents && <p className="person__parents">{person.parents}</p>}
      {person.words && <p className="person__words">{person.words}</p>}
    </Reveal>
  )
}

export default function Couple() {
  return (
    <Section id="couple" className="section--couple" label="The couple">
      <SectionHeading kicker="Two families, one story" title="The Couple" />

      <div className="couple__grid">
        <Portrait personKey={couple.order[0]} index={0} />
        <Reveal className="couple__amp" delay={120}>
          <span>&amp;</span>
        </Reveal>
        <Portrait personKey={couple.order[1]} index={1} />
      </div>
    </Section>
  )
}
