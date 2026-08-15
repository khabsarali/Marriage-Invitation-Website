import { useMemo, useState } from 'react'
import { Reveal, Rule } from '../site/primitives.jsx'
import { PageFooter, PageHeader } from './parts.jsx'
import { cities, rsvp as rsvpConfig, rsvpPage } from '../../config/wedding.config.js'
import { clampGuests, deliver, guestOptions, mailHref, summarise, whatsappHref } from '../../lib/rsvp.js'

/**
 * The full response card.
 *
 * Five questions in the order they would be asked at a door: who you are, how
 * to reach you, whether you are coming, how many of you, and which city. The
 * message is last and optional, as a note on a card would be.
 *
 * The guest count is the one place this form is opinionated. An invitation
 * admits the person it is addressed to and, at most, one guest, so the picker
 * offers exactly the two counts and the value is clamped to the same range
 * before it is delivered — a number typed into the payload by hand cannot get
 * past `clampGuests`. Both bounds come from the config, not from this file.
 *
 * Delivery is the invitation's own: lib/rsvp.js, the same endpoint, the same
 * localStorage key, the same WhatsApp and email fallback. No backend is faked
 * here; set `rsvp.endpoint` and this form starts posting to it.
 */
const COUNT_WORDS = { 1: 'One Person', 2: 'Two Persons' }
const NUMERALS = { 1: '01', 2: '02', 3: '03', 4: '04' }

const emptyForm = { name: '', contact: '', attending: '', guests: 1, celebration: '', message: '' }

/** Dubai, Karachi, Both — the cities are read, never typed out again. */
const CELEBRATIONS = [
  ...cities.map((city) => city.name),
  ...(rsvpPage.bothLabel ? [rsvpPage.bothLabel] : []),
]

export default function RsvpPage() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const summary = useMemo(() => summarise(form), [form])
  const whatsapp = whatsappHref(summary)
  const mail = mailHref(summary, form.name)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please tell us your name.')
    if (!form.attending) return setError('Please let us know if you can join us.')
    if (form.attending === 'yes' && !form.celebration) {
      return setError('Please choose which celebration you will join.')
    }

    setError('')
    setStatus('sending')
    try {
      await deliver(form)
      setStatus('done')
    } catch {
      setStatus('error')
      setError('We could not send that automatically. Please use one of the buttons below.')
    }
  }

  if (status === 'done') {
    const accepted = form.attending === 'yes'
    return (
      <article className="page-view page-view--night">
        <div className="page-shell page-shell--narrow">
          <Reveal className="thanks">
            <p className="eyebrow eyebrow--on-dark">{accepted ? rsvpPage.thanks.heading : 'We understand'}</p>
            <h1 className="page-title thanks__title">
              {accepted ? rsvpPage.thanks.heading : 'You will be missed'}
            </h1>
            <Rule className="rule--on-dark" />
            <p className="page-lede">
              {accepted ? rsvpPage.thanks.line : rsvpPage.thanks.declined}
            </p>

            {accepted && (
              <p className="thanks__detail">
                {form.guests === 1 ? 'One place' : 'Two places'} held
                {form.celebration ? ` · ${form.celebration}` : ''}
              </p>
            )}

            {(whatsapp || mail) && (
              <div className="thanks__handoff">
                <p>Please also send us your reply so we have it on record:</p>
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
              Send another reply
            </button>
          </Reveal>

          <PageFooter current="/rsvp" />
        </div>
      </article>
    )
  }

  return (
    <article className="page-view page-view--night">
      <div className="page-shell page-shell--narrow">
        <PageHeader eyebrow={rsvpPage.eyebrow} lines={rsvpPage.headingLines} intro={rsvpPage.intro} />

        <Reveal as="form" className="card card--on-dark" onSubmit={submit} noValidate delay={200}>
          <div className="field">
            <label htmlFor="rsvp-full-name">Full name</label>
            <input
              id="rsvp-full-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="As you would like it on the place card"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="rsvp-contact">
              Phone or email <span>(so we can reach you)</span>
            </label>
            <input
              id="rsvp-contact"
              name="contact"
              type="text"
              autoComplete="tel email"
              placeholder="A number or an address"
              value={form.contact}
              onChange={(e) => set({ contact: e.target.value })}
            />
          </div>

          <fieldset className="field field--choice">
            <legend>Will you join us?</legend>
            <div className="choice">
              <button
                type="button"
                className={`choice__btn${form.attending === 'yes' ? ' is-active' : ''}`}
                onClick={() => set({ attending: 'yes', guests: clampGuests(form.guests) })}
                aria-pressed={form.attending === 'yes'}
              >
                Joyfully Accepts
              </button>
              <button
                type="button"
                className={`choice__btn${form.attending === 'no' ? ' is-active' : ''}`}
                onClick={() => set({ attending: 'no', guests: 0, celebration: '' })}
                aria-pressed={form.attending === 'no'}
              >
                Regretfully Declines
              </button>
            </div>
          </fieldset>

          {form.attending === 'yes' && (
            <>
              <fieldset className="field field--choice">
                <legend>How many of you?</legend>
                <div className="count">
                  {guestOptions().map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`count__btn${form.guests === n ? ' is-active' : ''}`}
                      onClick={() => set({ guests: clampGuests(n) })}
                      aria-pressed={form.guests === n}
                    >
                      <span className="count__numeral" aria-hidden="true">
                        {NUMERALS[n] ?? n}
                      </span>
                      <span className="count__label">{COUNT_WORDS[n] ?? `${n} Guests`}</span>
                    </button>
                  ))}
                </div>
                <p className="field__note">
                  {rsvpConfig.maxGuests === 2
                    ? 'Your invitation admits you and one guest.'
                    : `Up to ${rsvpConfig.maxGuests} guests.`}
                </p>
              </fieldset>

              <fieldset className="field field--choice">
                <legend>Which celebration will you attend?</legend>
                <div className="choice choice--three">
                  {CELEBRATIONS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`choice__btn${form.celebration === name ? ' is-active' : ''}`}
                      onClick={() => set({ celebration: name })}
                      aria-pressed={form.celebration === name}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <div className="field">
            <label htmlFor="rsvp-note">
              Message <span>(optional)</span>
            </label>
            <textarea
              id="rsvp-note"
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

          <button type="submit" className="btn btn--block btn--on-dark" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Submit RSVP'}
          </button>

          {rsvpConfig.deadline && <p className="rsvp__deadline">Kindly reply by {rsvpConfig.deadline}.</p>}
        </Reveal>

        <PageFooter current="/rsvp" />
      </div>
    </article>
  )
}
