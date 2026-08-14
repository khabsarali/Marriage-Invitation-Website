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

import { useDeviceProfile, usePrefersReducedMotion } from './lib/hooks.js'
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

export default function App() {
  const { isMobile } = useDeviceProfile()
  const reducedMotion = usePrefersReducedMotion()
  useStableViewportHeight()

  const filmEnabled = ENABLE_3D_EXPERIENCE
  const [opened, setOpened] = useState(false)
  const onOpened = useCallback(() => setOpened(true), [])

  // The portrait plate is what a phone will actually paint with, so that is the
  // one the preloader waits for — waiting on the landscape file would hold the
  // page for an image the visitor never sees.
  const heroStill = isMobile ? heroConfig.still.tall : heroConfig.still.wide

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
      {!opened && <Preloader heroSrc={heroStill} onDone={onOpened} />}

      <Nav />

      <main className={`page${opened ? ' is-open' : ''}`}>
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
        <Countdown reducedMotion={reducedMotion} />
        <Rsvp />
        <Closing reducedMotion={reducedMotion} />
      </main>
    </>
  )
}
