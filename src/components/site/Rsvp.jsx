import { useMemo, useState } from 'react'
import { Reveal, MaskLines, Rule } from './primitives.jsx'
import { rsvp as rsvpConfig, coupleNames } from '../../config/wedding.config.js'

/**
 * The response card.
 *
 * Four questions, in the order they would be printed: your name, whether you
 * will come, how many of you, and anything you would like to say. The evenings
 * picker that used to sit in here is gone — the evenings have no dates yet, so
 * asking guests to choose between them asks them to commit to nothing.
 *
 * Fields are ruled lines rather than boxes, which is what a card looks like and
 * happens to be far less furniture on the page.
 *
 * Delivery is unchanged: POST to `endpoint` when one is configured, keep a copy
 * in localStorage either way, and offer WhatsApp and email as the fallback.
 * With all three unset the reply is still acknowledged and stored, so the form
 * is never a dead end while the family decides where replies should go.
 */
const STORAGE_KEY = 'wedding-rsvp'

const emptyForm = { name: '', attending: '', guests: 1, message: '' }

/** A readable one-message summary, used for the WhatsApp / email handoff. */
function summarise(form) {
  const lines = [
    `RSVP for ${coupleNames[0]} & ${coupleNames[1]}`,
    `Name: ${form.name}`,
    form.attending === 'yes'
      ? `Attending: Joyfully — ${form.guests} ${form.guests === 1 ? 'guest' : 'guests'}`
      : 'Attending: Regretfully unable',
  ]
  if (form.message.trim()) lines.push(`Message: ${form.message.trim()}`)
  return lines.join('\n')
}

export default function Rsvp() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
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
      <section className="section section--ivory rsvp" id="rsvp" aria-label="RSVP">
        <div className="section__inner rsvp__inner">
          <Reveal className="rsvp__thanks">
            <p className="eyebrow">{accepted ? 'Thank you' : 'We understand'}</p>
            <h2 className="rsvp__heading">{accepted ? 'Your seat is saved' : 'You will be missed'}</h2>
            <Rule tight />
            <p className="rsvp__intro">
              {accepted
                ? `We have you down for ${form.guests} ${form.guests === 1 ? 'guest' : 'guests'}. We cannot wait to celebrate with you.`
                : 'Thank you for letting us know. You will be in our thoughts on the day.'}
            </p>

            {(whatsappHref || mailHref) && (
              <div className="rsvp__handoff">
                <p>Please also send us your reply so we have it on record:</p>
                <div className="rsvp__actions">
                  {whatsappHref && (
                    <a className="btn" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      Send on WhatsApp
                    </a>
                  )}
                  {mailHref && (
                    <a className="btn btn--quiet" href={mailHref}>
                      Send by email
                    </a>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              className="link"
              onClick={() => {
                setForm(emptyForm)
                setStatus('idle')
              }}
            >
              Send another reply
            </button>
          </Reveal>
        </div>
      </section>
    )
  }

  return (
    <section className="section section--ivory rsvp" id="rsvp" aria-label="RSVP">
      <div className="section__inner rsvp__inner">
        <Reveal as="p" className="eyebrow">
          {rsvpConfig.eyebrow}
        </Reveal>
        <MaskLines as="h2" className="rsvp__heading" lines={[rsvpConfig.heading]} delay={100} />
        <Reveal as="p" className="rsvp__intro" delay={180}>
          {rsvpConfig.intro}
        </Reveal>

        <Reveal as="form" className="card" onSubmit={submit} noValidate delay={240}>
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
                onClick={() => set({ attending: 'yes', guests: form.guests || 1 })}
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
          )}

          <div className="field">
            <label htmlFor="rsvp-message">
              A note for the couple <span>(optional)</span>
            </label>
            <textarea
              id="rsvp-message"
              rows="3"
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

          <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send our reply'}
          </button>

          {rsvpConfig.deadline && <p className="rsvp__deadline">Kindly reply by {rsvpConfig.deadline}.</p>}
        </Reveal>
      </div>
    </section>
  )
}
