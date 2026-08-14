import { logo } from '../../config/wedding.config.js'

const LINKS = [
  { href: '#invitation', label: 'Invitation' },
  { href: '#events', label: 'Events' },
  { href: '#couple', label: 'Couple' },
  { href: '#rsvp', label: 'RSVP' },
]

/** Appears only once the film has handed over to the invitation. */
export default function Nav({ visible }) {
  const go = (e, href) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (!target) return
    if (window.lenis) window.lenis.scrollTo(target, { offset: -8, duration: 1.2 })
    else target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`nav${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <a className="nav__mark" href="#invitation" onClick={(e) => go(e, '#invitation')}>
        <img src={logo.mark} alt={logo.alt} width="640" height="597" />
      </a>
      <nav aria-label="Sections">
        <ul className="nav__list">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={(e) => go(e, link.href)} tabIndex={visible ? 0 : -1}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
