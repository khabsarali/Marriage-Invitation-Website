import { Reveal, MaskLines, Rule } from '../site/primitives.jsx'
import { navigate } from '../../lib/router.js'
import { tbc } from '../../config/wedding.config.js'

/**
 * The pieces the four information pages are built from.
 *
 * They are their own file rather than additions to site/primitives.jsx because
 * the invitation and these pages want different things: the invitation is one
 * scroll with a ground that changes under you, and these are four short pages
 * that each open the same way — a tracked eyebrow, a masked title, a rule, a
 * line of introduction — on one dark ground.
 *
 * Everything here obeys the config's rule: a detail that has not been settled
 * says so, in the invitation's voice, and a button that would go nowhere is not
 * rendered at all.
 */

/** The head of a page. Same three beats every time, so the four feel like a set. */
export function PageHeader({ eyebrow, lines, intro }) {
  return (
    <header className="page-head">
      <Reveal as="p" className="eyebrow eyebrow--on-dark">
        {eyebrow}
      </Reveal>
      <MaskLines as="h1" className="page-title" lines={lines} delay={100} />
      <Reveal delay={240}>
        <Rule className="rule--on-dark" />
      </Reveal>
      {intro && (
        <Reveal as="p" className="page-lede" delay={320}>
          {intro}
        </Reveal>
      )}
    </header>
  )
}

/**
 * One fact. `value` of null is not a blank — it prints "To be announced", the
 * same wording the three evenings use, so a detail that is still coming reads
 * as deliberate rather than as a hole in the page.
 */
export function Detail({ label, value, href }) {
  const has = value !== null && value !== undefined && value !== ''
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd className={has ? undefined : 'is-pending'}>
        {has && href ? <a href={href}>{value}</a> : has ? value : tbc.short}
      </dd>
    </div>
  )
}

/**
 * A city's plate: its name in tracked caps, a line of its own beneath, and
 * whatever the page puts inside. The two cities on a page are identical in
 * structure, so the eye learns the pattern once and then only reads what
 * changed — the same reasoning as the events timeline.
 */
export function Plate({ city, kicker, dates, children, delay = 0 }) {
  return (
    <Reveal as="section" className="plate" delay={delay} aria-label={city}>
      <div className="plate__head">
        <h2 className="plate__city">{city}</h2>
        {kicker && <p className="plate__kicker">{kicker}</p>}
        {dates && <p className="plate__dates">{dates}</p>}
      </div>
      <div className="plate__body">{children}</div>
    </Reveal>
  )
}

/** The row of buttons under a plate. Renders nothing when nothing is real yet. */
export function Actions({ children }) {
  const any = Array.isArray(children) ? children.some(Boolean) : Boolean(children)
  if (!any) return null
  return <div className="plate__actions">{children}</div>
}

/**
 * The way back, and across. The invitation's own nav carries five of the seven
 * links; this carries the rest, which is how /contact is reachable without
 * touching the nav the family already signed off.
 */
const FOOTER_LINKS = [
  { to: '/', label: 'The Invitation' },
  { to: '/booking', label: 'Your Stay' },
  { to: '/location', label: 'Location' },
  { to: '/contact', label: 'Contact' },
  { to: '/rsvp', label: 'RSVP' },
]

export function PageFooter({ current }) {
  return (
    <Reveal as="nav" className="page-foot" aria-label="Pages" delay={120}>
      <Rule className="rule--on-dark" />
      <ul>
        {FOOTER_LINKS.filter((link) => link.to !== current).map((link) => (
          <li key={link.to}>
            <a
              href={link.to}
              onClick={(e) => {
                e.preventDefault()
                navigate(link.to)
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

/** The one ornament these pages add: a plotted point, drawn not photographed. */
export function PinMark() {
  return (
    <svg className="pin" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s7-7.06 7-12a7 7 0 1 0-14 0c0 4.94 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}
