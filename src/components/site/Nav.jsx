import { useEffect, useState } from 'react'
import { logo } from '../../config/wedding.config.js'
import { useScrolledPast } from '../../lib/hooks.js'
import { navigate, useRoute } from '../../lib/router.js'

/**
 * Nine words and a monogram.
 *
 * Over the hero it is light and has no ground of its own; once the page has
 * scrolled past the hero it settles onto paper and turns to ink. Below 1100px
 * the links collapse into a full-screen sheet — nine tracked labels need that
 * much room, and squeezed into less they are a row of unreadable stubs.
 *
 * Two kinds of link, one list. `hash` scrolls to a section of the invitation;
 * `to` is a page of its own. From a page, a hash link is not a scroll but a
 * journey home to that section — which is why `go` checks where it is standing
 * before deciding what to do.
 */
const LINKS = [
  { hash: '#invitation', label: 'Invitation' },
  { hash: '#celebrations', label: 'Celebration' },
  { hash: '#couple', label: 'Couple' },
  { hash: '#events', label: 'Events' },
  { to: '/booking', label: 'Booking' },
  { to: '/location', label: 'Location' },
  { to: '/makeup-hair', label: 'Makeup & Hair' },
  { to: '/shuttle', label: 'Shuttle Service' },
  { to: '/rsvp', label: 'RSVP' },
]

export default function Nav() {
  const settled = useScrolledPast(140)
  const route = useRoute()
  const [open, setOpen] = useState(false)

  // The sheet covers the page, so the page must not scroll behind it. Lenis is
  // stopped as well as the body being locked, or a wheel event would still move
  // the smoothed scroll position underneath.
  useEffect(() => {
    document.body.classList.toggle('is-locked', open)
    if (open) window.lenis?.stop()
    else window.lenis?.start()
    return () => {
      document.body.classList.remove('is-locked')
      window.lenis?.start()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (e, link) => {
    e.preventDefault()
    setOpen(false)

    if (link.to) {
      navigate(link.to)
      return
    }
    // A section of the invitation, asked for from somewhere else: go home, and
    // let the invitation scroll to it once it has mounted.
    if (route.path !== '/') {
      navigate(`/${link.hash}`)
      return
    }

    const target = document.querySelector(link.hash)
    if (!target) return
    // The sheet closes on the same tick, so the scroll waits a frame for the
    // body lock to lift — otherwise the jump lands short.
    requestAnimationFrame(() => {
      if (window.lenis) window.lenis.scrollTo(target, { offset: -10, duration: 1.3 })
      else target.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const href = (link) => link.to ?? link.hash
  const isCurrent = (link) => (link.to ? route.path === link.to : false)

  return (
    <>
      <header className={`nav${settled ? ' is-settled' : ''}${open ? ' is-open' : ''}`}>
        <a className="nav__mark" href="/" onClick={(e) => go(e, { hash: '#invitation' })}>
          <img src={logo.mark} alt={logo.alt} width="420" height="392" />
        </a>

        <nav className="nav__links" aria-label="Sections">
          <ul>
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={href(link)}
                  onClick={(e) => go(e, link)}
                  aria-current={isCurrent(link) ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="nav__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="nav-sheet"
        >
          <span className="nav__toggle-bars" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="nav__toggle-label">{open ? 'Close' : 'Menu'}</span>
        </button>
      </header>

      {/* Kept in the tree rather than unmounted so it can fade out as well as in.
          `visibility` takes it out of the accessibility tree; the tabIndex keeps
          it out of the tab order in browsers that get there first. */}
      <div
        id="nav-sheet"
        className={`sheet${open ? ' is-open' : ''}`}
        aria-hidden={!open}
      >
        <nav aria-label="Sections">
          <ul className="sheet__list">
            {LINKS.map((link, i) => (
              <li key={link.label} style={{ transitionDelay: `${120 + i * 70}ms` }}>
                <a
                  href={href(link)}
                  onClick={(e) => go(e, link)}
                  tabIndex={open ? 0 : -1}
                  aria-current={isCurrent(link) ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
