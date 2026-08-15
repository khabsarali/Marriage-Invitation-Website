/**
 * The whole router. Five routes, no dependency.
 *
 * A router library would be a fair chunk of JavaScript to decide between five
 * strings, and this site hand-rolls its parallax, its reveals and its frame
 * loader already. So: read the path, listen for changes, push a new one.
 *
 * An unknown path resolves to the invitation rather than to a 404 page —
 * a wedding invitation that greets a mistyped URL with an error is worse than
 * one that quietly shows the invitation.
 *
 * Note for deploys: these are real paths, so the host has to answer /booking
 * with index.html. public/_redirects covers Netlify and Cloudflare Pages; see
 * the README for the others.
 */
import { useEffect, useState } from 'react'

/** Every route the site answers to. The first is the invitation itself. */
export const ROUTES = [
  '/',
  '/booking',
  '/location',
  '/contact',
  '/rsvp',
  '/makeup-hair',
  '/shuttle',
]

const EVENT = 'route:change'

/** Vite's base, so a project deployed under a sub-path still routes. */
const BASE = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')

const strip = (pathname) => {
  const path = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
  return path.replace(/\/+$/, '') || '/'
}

/** The current route, defensively — this module is imported before any render. */
export function currentRoute() {
  const loc = typeof window !== 'undefined' && window.location ? window.location : null
  if (!loc) return { path: '/', hash: '' }
  const path = strip(loc.pathname)
  return { path: ROUTES.includes(path) ? path : '/', hash: loc.hash || '' }
}

/**
 * Go somewhere. `to` is a route, optionally with a hash ('/#couple').
 *
 * Navigating to where we already are is not a no-op: the nav's monogram points
 * at the invitation, and pressing it from the invitation should take you back
 * to the top of it.
 */
export function navigate(to) {
  const [path, hash] = to.split('#')
  const target = `${BASE}${path === '/' ? '/' : path}${hash ? `#${hash}` : ''}`
  window.history.pushState({}, '', target)
  window.dispatchEvent(new Event(EVENT))
}

/** Subscribes to the route: the back button and navigate() both land here. */
export function useRoute() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('popstate', onChange)
    window.addEventListener(EVENT, onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener(EVENT, onChange)
    }
  }, [])

  return route
}
