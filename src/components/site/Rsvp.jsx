import { useMemo, useState } from 'react'
import { Section, SectionHeading, Reveal } from './primitives.jsx'
import { rsvp as rsvpConfig, events, coupleNames } from '../../config/wedding.config.js'

const STORAGE_KEY = 'wedding-rsvp'

const emptyForm = {
  name: '',
  attending: '',
  guests: 1,
  events: events.map((e) => e.id),
  message: '',
}

/** A readable one-message summary, used for the WhatsApp / email handoff. */
function summarise(form) {
  const eventNames = events
    .filter((e) => form.events.includes(e.id))
    .map((e) => e.name)
    .join(', ')

  const lines = [
    `RSVP for ${coupleNames[0]} & ${coupleNames[1]}`,
    `Name: ${form.name}`,
    form.attending === 'yes'
      ? `Attending: Yes — ${form.guests} ${form.guests === 1 ? 'guest' : 'guests'}`
      : 'Attending: Sadly unable to attend',
  ]
  if (form.attending === 'yes' && eventNames) lines.push(`Events: ${eventNames}`)
  if (form.message.trim()) lines.push(`Message: ${form.message.trim()}`)
  return lines.join('\n')
}

export default function Rsvp() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const toggleEvent = (id) =>
    setForm((f) => ({
      ...f,
      events: f.events.includes(id) ? f.events.filter((e) => e !== id) : [...f.events, id],
    }))

  const summary = useMemo(() => summarise(form), [form])

  const whatsappHref = rsvpConfig.whatsapp
    ? `https://wa.me/${rsvpConfig.whatsapp}?text=${encodeURIComponent(summary)}`
    : null
  const mailHref = rsvpConfig.email
    ? `mailto:${rsvpConfig.email}?subject=${encodeURIComponent(
        `RSVP — ${form.name || 'Wedding'}`
      )}&body=${encodeURIComponent(summary)}`
    : null

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Please tell us your name.')
      return
    }
    if (!form.attending) {
      setError('Please let us know if you can join us.')
      return
    }

    setError('')
    setStatus('sending')
    const payload = { ...form, submittedAt: new Date().toISOString() }

    try {
      if (rsvpConfig.endpoint) {
        const res = await fetch(rsvpConfig.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {
        /* private browsing — the reply still went through */
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setError('We could not send that automatically. Please use one of the buttons below.')
    }
  }

  if (status === 'done') {
    const accepted = form.attending === 'yes'
    return (
      <Section id="rsvp" className="section--rsvp" label="RSVP">
        <Reveal className="rsvp__thanks">
          <p className="rsvp__thanks-kicker">{accepted ? 'Thank you' : 'We understand'}</p>
          <h2 className="rsvp__thanks-title">
            {accepted ? 'Your seat is saved' : 'You will be missed'}
          </h2>
          <p className="rsvp__thanks-body">
            {accepted
              ? `We have you down for ${form.guests} ${form.guests === 1 ? 'guest' : 'guests'}. We cannot wait to celebrate with you.`
              : 'Thank you for letting us know. You will be in our thoughts on the day.'}
          </p>

          <div className="rsvp__handoff">
            <p>Please also send us your reply so we have it on record:</p>
            <div className="rsvp__handoff-actions">
              {whatsappHref && (
                <a className="btn btn--solid" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  Send on WhatsApp
                </a>
              )}
              {mailHref && (
                <a className="btn btn--ghost" href={mailHref}>
                  Send by email
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            className="rsvp__again"
            onClick={() => {
              setForm(emptyForm)
              setStatus('idle')
            }}
          >
            Send another reply
          </button>
        </Reveal>
      </Section>
    )
  }

  return (
    <Section id="rsvp" className="section--rsvp" label="RSVP">
      <SectionHeading kicker="RSVP" title={rsvpConfig.heading} intro={rsvpConfig.intro} />

      <Reveal as="form" className="rsvp__form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="rsvp-name">Your name</label>
          <input
            id="rsvp-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="As you would like it on the place card"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            required
          />
        </div>

        <fieldset className="field field--choice">
          <legend>Will you join us?</legend>
          <div className="choice">
            <button
              type="button"
              className={`choice__btn${form.attending === 'yes' ? ' is-active' : ''}`}
              onClick={() => set({ attending: 'yes' })}
              aria-pressed={form.attending === 'yes'}
            >
              Joyfully Accept
            </button>
            <button
              type="button"
              className={`choice__btn${form.attending === 'no' ? ' is-active' : ''}`}
              onClick={() => set({ attending: 'no', guests: 0 })}
              aria-pressed={form.attending === 'no'}
            >
              Regretfully Decline
            </button>
          </div>
        </fieldset>

        {form.attending === 'yes' && (
          <>
            <div className="field">
              <label htmlFor="rsvp-guests">Number of guests</label>
              <select
                id="rsvp-guests"
                value={form.guests}
                onChange={(e) => set({ guests: Number(e.target.value) })}
              >
                {Array.from({ length: rsvpConfig.maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'guest' : 'guests'}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="field field--events">
              <legend>Which evenings?</legend>
              <div className="pills">
                {events.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className={`pill${form.events.includes(event.id) ? ' is-active' : ''}`}
                    onClick={() => toggleEvent(event.id)}
                    aria-pressed={form.events.includes(event.id)}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <div className="field">
          <label htmlFor="rsvp-message">A note for the couple <span>(optional)</span></label>
          <textarea
            id="rsvp-message"
            rows="4"
            placeholder="A blessing, a memory, a song request…"
            value={form.message}
            onChange={(e) => set({ message: e.target.value })}
          />
        </div>

        {error && (
          <p className="rsvp__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--solid btn--block" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send our reply'}
        </button>

        <p className="rsvp__deadline">Kindly reply by {rsvpConfig.deadline}.</p>
      </Reveal>
    </Section>
  )
}
