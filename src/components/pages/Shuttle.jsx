import { useMemo, useState } from 'react'
import { Reveal, Rule } from '../site/primitives.jsx'
import { Actions, Detail, PageFooter, PageHeader, PinMark, Plate } from './parts.jsx'
import { cities, cityById, shuttle } from '../../config/wedding.config.js'
import { navigate } from '../../lib/router.js'
import { canDeliver, clampSeats, deliver, mailHref, seatOptions, summarise, whatsappHref } from '../../lib/enquiry.js'

/**
 * The shuttle, and nothing else. Makeup & hair has a page of its own.
 *
 * The one thing this page can say for certain is said first and largest: there
 * will be a shuttle. Everything under it — where it leaves from, when, and when
 * it comes back — is null until it is settled, and reads "To be announced"
 * rather than being guessed at.
 *
 * Both cities carry the button through to /location. The spec asked for it on
 * Dubai; the two plates are identical in structure everywhere else on this
 * site, and a guest travelling to Karachi wants the address just as much.
 *
 * The seat form holds to one or two seats, from the config, clamped before
 * delivery — and, like the makeup request, it does not claim to have sent
 * anything while there is nowhere for it to go.
 */
const KIND = 'Shuttle seat reservation'
const SEAT_WORDS = { 1: 'One Seat', 2: 'Two Seats' }
const NUMERALS = { 1: '01', 2: '02', 3: '03', 4: '04' }

const emptyForm = { name: '', contact: '', celebration: '', seats: 1 }

export default function Shuttle() {
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
    if (!form.celebration) return setError('Please choose which celebration you are travelling to.')

    setError('')
    setStatus('sending')
    try {
      await deliver(KIND, { ...form, seats: clampSeats(form.seats) })
      setStatus('done')
    } catch {
      setStatus('error')
      setError('We could not send that automatically. Please use one of the buttons below.')
    }
  }

  return (
    <article className="page-view page-view--night">
      <div className="page-shell">
        <PageHeader eyebrow={shuttle.eyebrow} lines={shuttle.headingLines} intro={shuttle.intro} />

        <Reveal as="p" className="statement" delay={380}>
          {shuttle.statement}
        </Reveal>

        <div className="plates">
          {shuttle.routes.map((route, i) => {
            const city = cityById(route.cityId)
            return (
              <Plate
                key={route.cityId}
                city={city.name}
                kicker={`Getting to the ${city.name} celebration`}
                dates={`${city.dates} ${city.month} ${city.year}`}
                delay={i * 140}
              >
                <dl className="details">
                  <Detail label="Pickup location" value={route.pickup} />
                  <Detail label="Departure time" value={route.departure} />
                  <Detail label="Wedding venue" value={route.venue} />
                  <Detail label="Return shuttle" value={route.returnRun} />
                </dl>

                <Actions>
                  <a
                    className="btn btn--quiet btn--on-dark"
                    href="/location"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate('/location')
                    }}
                  >
                    <PinMark />
                    View route
                  </a>
                </Actions>
              </Plate>
            )
          })}
        </div>

        <section className="form-block" aria-label={shuttle.reserve.eyebrow}>
          <Reveal as="p" className="eyebrow eyebrow--on-dark">
            {shuttle.reserve.eyebrow}
          </Reveal>
          <Reveal as="h2" className="page-subtitle" delay={80}>
            {shuttle.reserve.heading}
          </Reveal>

          {status === 'done' ? (
            <Reveal className="card card--on-dark note" delay={120}>
              <h3 className="note__title">Thank you</h3>
              <Rule className="rule--on-dark" tight />
              <p className="note__body">
                {canDeliver()
                  ? `We have you down for ${form.seats === 1 ? 'one seat' : 'two seats'}${form.celebration ? ` in ${form.celebration}` : ''}.`
                  : `Noted on this device: ${form.seats === 1 ? 'one seat' : 'two seats'}${form.celebration ? ` in ${form.celebration}` : ''}. Nothing has been sent yet — the shuttle times are still being arranged, and we will confirm your seat with you directly.`}
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
                Reserve another seat
              </button>
            </Reveal>
          ) : (
            <Reveal as="form" className="card card--on-dark" onSubmit={submit} noValidate delay={120}>
              <div className="field">
                <label htmlFor="shuttle-name">Full name</label>
                <input
                  id="shuttle-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="shuttle-contact">Phone / WhatsApp</label>
                <input
                  id="shuttle-contact"
                  type="tel"
                  autoComplete="tel"
                  placeholder="A number we can reach you on"
                  value={form.contact}
                  onChange={(e) => set({ contact: e.target.value })}
                  required
                />
              </div>

              <fieldset className="field field--choice">
                <legend>Celebration</legend>
                <div className="choice">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      className={`choice__btn${form.celebration === city.name ? ' is-active' : ''}`}
                      onClick={() => set({ celebration: city.name })}
                      aria-pressed={form.celebration === city.name}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field field--choice">
                <legend>Number of seats</legend>
                <div className="count">
                  {seatOptions().map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`count__btn${form.seats === n ? ' is-active' : ''}`}
                      onClick={() => set({ seats: clampSeats(n) })}
                      aria-pressed={form.seats === n}
                    >
                      <span className="count__numeral" aria-hidden="true">
                        {NUMERALS[n] ?? n}
                      </span>
                      <span className="count__label">{SEAT_WORDS[n] ?? `${n} Seats`}</span>
                    </button>
                  ))}
                </div>
                <p className="field__note">
                  {shuttle.maxSeats === 2
                    ? 'Two seats at most — yourself and one guest.'
                    : `Up to ${shuttle.maxSeats} seats.`}
                </p>
              </fieldset>

              {error && (
                <p className="rsvp__error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn--block btn--on-dark" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Reserve my seat'}
              </button>

              {!canDeliver() && (
                <p className="form-note">
                  Seats are noted here and confirmed with you directly — the shuttle times are still
                  being arranged.
                </p>
              )}
            </Reveal>
          )}
        </section>

        <PageFooter current="/shuttle" />
      </div>
    </article>
  )
}
