import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import StoryLoader from './components/loader/StoryLoader.jsx'
import CinematicExperience from './components/cinematic/CinematicExperience.jsx'
import Nav from './components/site/Nav.jsx'
import Hero from './components/site/Hero.jsx'
import Countdown from './components/site/Countdown.jsx'
import Events from './components/site/Events.jsx'
import Venue from './components/site/Venue.jsx'
import Couple from './components/site/Couple.jsx'
import Gallery from './components/site/Gallery.jsx'
import Rsvp from './components/site/Rsvp.jsx'
import Footer from './components/site/Footer.jsx'

import { FrameSequence } from './lib/FrameSequence.js'
import { loadManifest } from './lib/manifest.js'
import { useDeviceProfile, usePrefersReducedMotion } from './lib/hooks.js'
import { loading } from './config/scenes.config.js'

gsap.registerPlugin(ScrollTrigger)

/**
 * Keeps a stable viewport height for the pinned stage. Mobile browsers change
 * innerHeight as the address bar collapses; reacting to every one of those
 * would make the film jump, so we only follow real layout changes.
 */
function useStableViewportHeight() {
  useEffect(() => {
    let last = 0
    const apply = (force) => {
      const h = window.innerHeight
      if (!force && Math.abs(h - last) < 120) return
      last = h
      document.documentElement.style.setProperty('--app-vh', `${h / 100}px`)
      ScrollTrigger.refresh()
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

  const [manifest, setManifest] = useState(null)
  const [sequence, setSequence] = useState(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading') // loading | leaving | ready | filmless
  const [filmDone, setFilmDone] = useState(false)
  const [filmActive, setFilmActive] = useState(true)
  const sequenceRef = useRef(null)

  /* ------------------------------------------------------------- load film */

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        const loaded = await loadManifest()
        if (cancelled) return

        const profile = isMobile ? 'mobile' : 'desktop'
        const variant = loaded.variants[profile]
        const seq = new FrameSequence({
          basePath: variant.path,
          count: loaded.count,
          concurrency: loading.concurrency[profile],
          decodeBudget: loading.textureBudget[profile],
          coarseStride: loading.coarseStride,
          leadFrames: loading.leadFrames,
        })
        sequenceRef.current = seq

        await seq.prime((p) => {
          if (!cancelled) setProgress(p)
        })
        if (cancelled) return

        setManifest(loaded)
        setSequence(seq)
        setPhase('leaving')
        setTimeout(() => !cancelled && setPhase('ready'), 900)
      } catch (err) {
        console.error('[invitation] the film could not be loaded', err)
        if (!cancelled) {
          setPhase('filmless')
          setFilmDone(true)
          setFilmActive(false)
        }
      }
    }

    boot()
    return () => {
      cancelled = true
      sequenceRef.current?.destroy()
    }
  }, [isMobile])

  /* ------------------------------------------------- scroll lock + smoothing */

  const showFilm = phase === 'ready' || phase === 'leaving'

  useEffect(() => {
    const locked = phase === 'loading'
    document.body.classList.toggle('is-locked', locked)
    if (locked) window.scrollTo(0, 0)
    return () => document.body.classList.remove('is-locked')
  }, [phase])

  useEffect(() => {
    if (phase === 'loading' || reducedMotion) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      syncTouch: false,
    })
    window.lenis = lenis

    const raf = (time) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      delete window.lenis
    }
  }, [phase, reducedMotion])

  const skipFilm = useCallback(() => {
    setPhase('filmless')
    setFilmDone(true)
    setFilmActive(false)
    sequenceRef.current?.destroy()
    sequenceRef.current = null
    setSequence(null)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  const onFilmFinish = useCallback(() => setFilmDone(true), [])

  return (
    <>
      {(phase === 'loading' || phase === 'leaving') && (
        <StoryLoader
          progress={progress}
          leaving={phase === 'leaving'}
          failed={false}
          onSkip={skipFilm}
        />
      )}

      <Nav visible={filmDone && !filmActive} />

      <main className="page">
        {showFilm && sequence && manifest && (
          <CinematicExperience
            manifest={manifest}
            sequence={sequence}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            onFinish={onFilmFinish}
            onActiveChange={setFilmActive}
          />
        )}

        <div className="invitation">
          <Hero />
          <Countdown />
          <Events />
          <Venue />
          <Couple />
          <Gallery />
          <Rsvp />
          <Footer />
        </div>
      </main>
    </>
  )
}
