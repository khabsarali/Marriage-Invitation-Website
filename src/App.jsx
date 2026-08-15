import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

import Preloader from './components/loader/Preloader.jsx'
import Nav from './components/site/Nav.jsx'
import Hero from './components/site/Hero.jsx'
import Crossing from './components/site/Crossing.jsx'
import Announcement from './components/site/Announcement.jsx'
import CoupleReveal from './components/site/CoupleReveal.jsx'
import Events from './components/site/Events.jsx'
import Countdown from './components/site/Countdown.jsx'
import Rsvp from './components/site/Rsvp.jsx'
import Closing from './components/site/Closing.jsx'

import Services from './components/site/Services.jsx'

import Booking from './components/pages/Booking.jsx'
import Location from './components/pages/Location.jsx'
import Contact from './components/pages/Contact.jsx'
import RsvpPage from './components/pages/RsvpPage.jsx'
import MakeupHair from './components/pages/MakeupHair.jsx'
import Shuttle from './components/pages/Shuttle.jsx'

import { useDeviceProfile, usePrefersReducedMotion } from './lib/hooks.js'
import { useRoute } from './lib/router.js'
import { ENABLE_3D_EXPERIENCE } from './config/scenes.config.js'
import { hero as heroConfig } from './config/wedding.config.js'

/**
 * The film — three.js, GSAP, the frame loader, the score, its own loading screen
 * and 34 MB of frames — behind one switch and one dynamic import.
 *
 * ENABLE_3D_EXPERIENCE is false, so the guard below never renders, so this
 * module is never fetched: no manifest request, therefore no frame requests, and
 * no three.js, GSAP or film.css in anything the browser downloads. That holds at
 * every viewport width — desktop, laptop, tablet and phone all get the
 * invitation and nothing else.
 *
 * Nothing has been deleted. Set the switch back to true in
 * src/config/scenes.config.js and the film returns, mounted here between the
 * hero and the rest of the invitation.
 */
const FilmStage = lazy(() => import('./components/cinematic/FilmStage.jsx'))

/**
 * Keeps a stable viewport height for the page. Mobile browsers change
 * innerHeight as the address bar collapses; reacting to every one of those would
 * make full-height sections jump, so we only follow real layout changes.
 */
function useStableViewportHeight() {
  useEffect(() => {
    let last = 0
    const apply = (force) => {
      const h = window.innerHeight
      if (!force && Math.abs(h - last) < 120) return
      last = h
      document.documentElement.style.setProperty('--app-vh', `${h / 100}px`)
    }
    apply(true)
    const onResize = () => apply(false)
    const onOrientation = () => setTimeout(() => apply(true), 250)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientation)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [])
}

/**
 * The invitation itself: unchanged, and still the whole of `/`.
 *
 * It is a component now only so the router has something to switch against —
 * the sections, their order and their props are exactly as they were.
 */
function Invitation({ filmEnabled, isMobile, reducedMotion }) {
  return (
    <>
      <Hero reducedMotion={reducedMotion} />

      {filmEnabled && (
        <Suspense fallback={null}>
          <FilmStage isMobile={isMobile} reducedMotion={reducedMotion} />
        </Suspense>
      )}

      <Crossing reducedMotion={reducedMotion} />
      <Announcement />
      <CoupleReveal />
      <Events />
      {/* The one addition to the invitation: two doors out to the service
          pages, between the order of events and the countdown. */}
      <Services />
      <Countdown reducedMotion={reducedMotion} />
      <Rsvp />
      <Closing reducedMotion={reducedMotion} />
    </>
  )
}

const PAGES = {
  '/booking': Booking,
  '/location': Location,
  '/contact': Contact,
  '/rsvp': RsvpPage,
  '/makeup-hair': MakeupHair,
  '/shuttle': Shuttle,
}

export default function App() {
  const { isMobile } = useDeviceProfile()
  const reducedMotion = usePrefersReducedMotion()
  useStableViewportHeight()

  const route = useRoute()
  const isHome = route.path === '/'
  const Page = PAGES[route.path]

  const filmEnabled = ENABLE_3D_EXPERIENCE
  // The envelope opens onto the invitation and waits for the invitation's own
  // plate, so it belongs to `/` alone: a guest who lands on /booking is already
  // past the door.
  const [opened, setOpened] = useState(() => !isHome)
  const onOpened = useCallback(() => setOpened(true), [])

  // The portrait crop is what a phone will actually paint with, so that is the
  // one the preloader waits for — waiting on the landscape file would hold the
  // page for an image the visitor never sees.
  const heroBackdrop = isMobile ? heroConfig.backdrop.tall : heroConfig.backdrop.wide

  /* ------------------------------------------------------------------ routing */

  // `.page` is transparent until it is open, and only the invitation has an
  // envelope to open it — so a page opens itself.
  useEffect(() => {
    if (!isHome) setOpened(true)
  }, [isHome])

  // Every navigation starts at the top, except one asking for a section of the
  // invitation by name, which lands on that section instead.
  useEffect(() => {
    if (!opened) return
    const target = isHome && route.hash ? document.querySelector(route.hash) : null
    if (!target) {
      window.scrollTo(0, 0)
      window.lenis?.scrollTo(0, { immediate: true })
      return
    }
    requestAnimationFrame(() => {
      if (window.lenis) window.lenis.scrollTo(target, { offset: -10, duration: 1.3 })
      else target.scrollIntoView({ behavior: 'smooth' })
    })
  }, [route.path, route.hash, isHome, opened])

  /* -------------------------------------------------- scroll lock + smoothing */

  useEffect(() => {
    document.body.classList.toggle('is-locked', !opened)
    if (!opened) window.scrollTo(0, 0)
    return () => document.body.classList.remove('is-locked')
  }, [opened])

  const lenisRef = useRef(null)

  useEffect(() => {
    if (!opened || reducedMotion) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      syncTouch: false,
    })
    lenisRef.current = lenis
    // The nav's mobile sheet stops and starts the smoothed scroll, and its
    // anchors scroll through it, so it needs a handle on the instance.
    window.lenis = lenis

    let frame = 0
    const raf = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
      delete window.lenis
    }
  }, [opened, reducedMotion])

  return (
    <>
      {isHome && !opened && <Preloader heroSrc={heroBackdrop} onDone={onOpened} />}

      <Nav />

      {/* Keyed on the route so a page mounts fresh — its reveals run again, and
          the fade is a real entrance rather than a swap of contents. */}
      <main className={`page${opened ? ' is-open' : ''}`} key={route.path}>
        {isHome ? (
          <Invitation filmEnabled={filmEnabled} isMobile={isMobile} reducedMotion={reducedMotion} />
        ) : (
          Page && <Page />
        )}
      </main>
    </>
  )
}
