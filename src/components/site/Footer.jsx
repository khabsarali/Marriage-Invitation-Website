import { Section, SectionHeading, Reveal, Ornament } from './primitives.jsx'
import { contacts, couple, coupleNames, site, weddingDate } from '../../config/wedding.config.js'

export default function Footer() {
  return (
    <>
      <Section id="contact" className="section--contact" label="Contact">
        <SectionHeading
          kicker="Any questions?"
          title="Family & Contact"
          intro="Our families would be glad to help with anything at all."
        />

        <div className="contacts">
          {contacts.map((person, i) => (
            <Reveal as="article" className="contact" key={person.name} delay={i * 90}>
              <p className="contact__role">{person.role}</p>
              <h3 className="contact__name">{person.name}</h3>
              <a className="contact__phone" href={`tel:${person.phone.replace(/\s+/g, '')}`}>
                {person.phone}
              </a>
            </Reveal>
          ))}
        </div>
      </Section>

      <footer className="footer">
        <div className="footer__inner">
          <Ornament className="ornament--wide" />
          <p className="footer__names">
            {coupleNames[0]} <span>&amp;</span> {coupleNames[1]}
          </p>
          <p className="footer__date">
            {weddingDate.day} {weddingDate.month} {weddingDate.year} · Lahore
          </p>
          <p className="footer__note">{site.footerNote}</p>
          <p className="footer__hashtag">{couple.hashtag}</p>
        </div>
      </footer>
    </>
  )
}
