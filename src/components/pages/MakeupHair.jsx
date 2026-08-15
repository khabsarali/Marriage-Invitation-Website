import { useMemo, useState } from 'react'
import { Reveal, Rule } from '../site/primitives.jsx'
import { Detail, PageFooter, PageHeader, Plate } from './parts.jsx'
import { beauty } from '../../config/wedding.config.js'
import { canDeliver, deliver, mailHref, summarise, whatsappHref } from '../../lib/enquiry.js'

/**
 * Makeup & hair, and nothing else. The shuttle has a page of its own.
 *
 * Two plates, four lines each — what is offered, when, where, and how it is
 * asked for — all null until artists are actually engaged, so all four read
 * "To be announced". No salon, artist, price, number or address is invented
 * here or anywhere else on the page.
 *
 * The request form does not pretend. With no channel configured in
 * `enquiries`, a submission is noted on the guest's own device and the
 * confirmation says exactly that; set an endpoint, a WhatsApp number or an
 * email address and both the behaviour and the wording change with it.
 */
const KIND = 'Makeup & hair request'

const emptyForm = { name: '', contact: '', service: '', date: '', message: '' }

export default function MakeupHair() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const summary = useMemo(() => summarise(KIND, form), [form])
  const whatsapp = whatsappHref(summary)
  const mail = mailHref(summary, `${KIND} — ${form.name || 'Wedding'}`)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please tell us your name.')
    if (!form.contact.trim()) return setError('Please leave us a number we can reach you on.')
    if (!form.service) return setError('Please choose which service you would like.')

    setError('')
    setStatus('sending')
    try {
      await deliver(KIND, form)
      setStatus('done')
    } catch {
      setStatus('error')
      setError('We could not send that automatically. Please use one of the buttons below.')
    }
  }

  return (
    <article className="page-view page-view--night">
      <div className="page-shell">
        <PageHeader eyebrow={beauty.eyebrow} lines={beauty.headingLines} intro={beauty.intro} />

        <div className="plates">
          {beauty.services.map((service, i) => (
            <Plate key={service.id} city={service.name} delay={i * 140}>
              <dl className="details">
                <Detail label="Service" value={service.offering} />
                <Detail label="Availability" value={service.availability} />
                <Detail label="Location" value={service.location} />
                <Detail label="Booking" value={service.booking} />
              </dl>
            </Plate>
          ))}
        </div>

        <section className="form-block" aria-label={beauty.request.eyebrow}>
          <Reveal as="p" className="eyebrow eyebrow--on-dark">
            {beauty.request.eyebrow}
          </Reveal>
          <Reveal as="h2" className="page-subtitle" delay={80}>
            {beauty.request.heading}
          </Reveal>

          {status === 'done' ? (
            <Reveal className="card card--on-dark note" delay={120}>
              <h3 className="note__title">Thank you</h3>
              <Rule className="rule--on-dark" tight />
              <p className="note__body">
                {canDeliver()
                  ? 'We have your request and will come back to you with times.'
                  : 'Your request is noted on this device. Nothing has been sent yet — the artists are still being arranged, and we will confirm with you directly once they are.'}
              </p>

              {(whatsapp || mail) && (
                <div className="plate__actions">
                  {whatsapp && (
                    <a className="btn btn--on-dark" href={whatsapp} target="_blank" rel="noopener noreferrer">
                      Send on WhatsApp
                    </a>
                  )}
                  {mail && (
                    <a className="btn btn--quiet btn--on-dark" href={mail}>
                      Send by email
                    </a>
                  )}
                </div>
              )}

              <button
                type="button"
                className="link link--on-dark"
                onClick={() => {
                  setForm(emptyForm)
                  setStatus('idle')
                }}
              >
                Make another request
              </button>
            </Reveal>
          ) : (
            <Reveal as="form" className="card card--on-dark" onSubmit={submit} noValidate delay={120}>
              <div className="field">
                <label htmlFor="beauty-name">Full name</label>
                <input
                  id="beauty-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="beauty-contact">Phone / WhatsApp</label>
                <input
                  id="beauty-contact"
                  type="tel"
                  autoComplete="tel"
                  placeholder="A number we can reach you on"
                  value={form.contact}
                  onChange={(e) => set({ contact: e.target.value })}
                  required
                />
              </div>

              <fieldset className="field field--choice">
                <legend>Service</legend>
                <div className="choice choice--three">
                  {beauty.request.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`choice__btn${form.service === option ? ' is-active' : ''}`}
                      onClick={() => set({ service: option })}
                      aria-pressed={form.service === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="field">
                <label htmlFor="beauty-date">
                  Preferred date <span>(optional)</span>
                </label>
                <input
                  id="beauty-date"
                  type="text"
                  placeholder="The evening, or a date"
                  value={form.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="beauty-message">
                  Message <span>(optional)</span>
                </label>
                <textarea
                  id="beauty-message"
                  rows="3"
                  placeholder="Anything we should know"
                  value={form.message}
                  onChange={(e) => set({ message: e.target.value })}
                />
              </div>

              {error && (
                <p className="rsvp__error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn--block btn--on-dark" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Request service'}
              </button>

              {/* Said before the button is pressed, not after. */}
              {!canDeliver() && (
                <p className="form-note">
                  Requests are noted here and confirmed with you directly — the artists are still
                  being arranged.
                </p>
              )}
            </Reveal>
          )}
        </section>

        <PageFooter current="/makeup-hair" />
      </div>
    </article>
  )
}
