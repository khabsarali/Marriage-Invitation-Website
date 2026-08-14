import { useEffect, useState } from 'react'
import { logo } from '../../config/wedding.config.js'
import { useScrolledPast } from '../../lib/hooks.js'

/**
 * Five words and a monogram.
 *
 * Over the hero it is light and has no ground of its own; once the page has
 * scrolled past the hero it settles onto paper and turns to ink. On phones the
 * links collapse into a full-screen sheet, because five tracked labels across a
 * 360px screen is a row of unreadable stubs.
 */
const LINKS = [
  { href: '#invitation', label: 'Invitation' },
  { href: '#celebrations', label: 'Celebration' },
  { href: '#couple', label: 'Couple' },
  { href: '#events', label: 'Events' },
  { href: '#rsvp', label: 'RSVP' },
]

export default function Nav() {
  const settled = useScrolledPast(140)
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

  const go = (e, href) => {
    e.preventDefault()
    setOpen(false)
    const target = document.querySelector(href)
    if (!target) return
    // The sheet closes on the same tick, so the scroll waits a frame for the
    // body lock to lift — otherwise the jump lands short.
    requestAnimationFrame(() => {
      if (window.lenis) window.lenis.scrollTo(target, { offset: -10, duration: 1.3 })
      else target.scrollIntoView({ behavior: 'smooth' })
    })
  }

  return (
    <>
      <header className={`nav${settled ? ' is-settled' : ''}${open ? ' is-open' : ''}`}>
        <a className="nav__mark" href="#invitation" onClick={(e) => go(e, '#invitation')}>
          <img src={logo.mark} alt={logo.alt} width="420" height="392" />
        </a>

        <nav className="nav__links" aria-label="Sections">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={(e) => go(e, link.href)}>
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
              <li key={link.href} style={{ transitionDelay: `${120 + i * 70}ms` }}>
                <a href={link.href} onClick={(e) => go(e, link.href)} tabIndex={open ? 0 : -1}>
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
