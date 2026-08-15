import { Reveal } from '../site/primitives.jsx'
import { Actions, Detail, PageFooter, PageHeader } from './parts.jsx'
import { contact } from '../../config/wedding.config.js'

/**
 * Contact — one card, because there is one person to ask.
 *
 * Each channel prints its label whether or not it is filled in, so the card
 * reads as a card rather than as a stub; the three buttons appear one at a time
 * as real numbers arrive. Until then nothing here dials, mails or opens a chat
 * with nobody.
 */
export default function Contact() {
  const { coordinator } = contact
  const tel = coordinator.phone ? `tel:${coordinator.phone.replace(/\s+/g, '')}` : null
  const wa = coordinator.whatsapp ? `https://wa.me/${coordinator.whatsapp}` : null
  const mail = coordinator.email ? `mailto:${coordinator.email}` : null

  return (
    <article className="page-view page-view--night">
      <div className="page-shell">
        <PageHeader eyebrow={contact.eyebrow} lines={contact.headingLines} intro={contact.intro} />

        <Reveal as="section" className="plate plate--single" aria-label={coordinator.role}>
          <div className="plate__head">
            <p className="plate__kicker">{coordinator.role}</p>
            <h2 className="plate__city plate__city--name">{coordinator.name ?? 'To be announced'}</h2>
          </div>

          <div className="plate__body">
            <dl className="details">
              <Detail label="Phone" value={coordinator.phone} href={tel} />
              <Detail label="WhatsApp" value={coordinator.whatsapp} href={wa} />
              <Detail label="Email" value={coordinator.email} href={mail} />
            </dl>

            <Actions>
              {tel && (
                <a className="btn btn--on-dark" href={tel}>
                  Call
                </a>
              )}
              {wa && (
                <a
                  className="btn btn--quiet btn--on-dark"
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              )}
              {mail && (
                <a className="btn btn--quiet btn--on-dark" href={mail}>
                  Email
                </a>
              )}
            </Actions>
          </div>
        </Reveal>

        <PageFooter current="/contact" />
      </div>
    </article>
  )
}
