import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import StoryLoader from './components/loader/StoryLoader.jsx'

/**
 * Loaded on demand, so the film's dependencies — three.js above all, ~116 kB
 * gzipped — are only fetched when the film is actually going to be shown. A
 * static import would put them in the first bundle and download them even with
 * ENABLE_3D_EXPERIENCE off. The component itself is untouched.
 */
const CinematicExperience = lazy(() => import('./components/cinematic/CinematicExperience.jsx'))
import Nav from './components/site/Nav.jsx'
import Prologue from './components/site/Prologue.jsx'
import Hero from './components/site/Hero.jsx'
import Countdown from './components/site/Countdown.jsx'
import Events from './components/site/Events.jsx'
import Venue from './components/site/Venue.jsx'
import Couple from './components/site/Couple.jsx'
import Rsvp from './components/site/Rsvp.jsx'
import Footer from './components/site/Footer.jsx'

import { FrameSequence } from './lib/FrameSequence.js'
import { FilmAudio } from './lib/FilmAudio.js'
import { loadManifest, resolveVariant } from './lib/manifest.js'
import { useDeviceProfile, usePrefersReducedMotion } from './lib/hooks.js'
import { ENABLE_3D_EXPERIENCE, loading, sound } from './config/scenes.config.js'

gsap.registerPlugin(ScrollTrigger)

const MUTE_KEY = 'invitation:muted'

/** Private-mode Safari throws on localStorage, and a mute toggle is not worth a crash. */
const readMuted = () => {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}
const writeMuted = (muted) => {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* not worth reporting */
  }
}

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

  const [variant, setVariant] = useState(null)
  const [sequence, setSequence] = useState(null)
  const [progress, setProgress] = useState(0)
  // With the film off the page opens straight into the invitation: 'filmless'
  // means no loader, no scroll lock and no pinned stage, and the nav is free to
  // show immediately because there is no film for it to get out of the way of.
  const [phase, setPhase] = useState(ENABLE_3D_EXPERIENCE ? 'loading' : 'filmless')
  const [filmDone, setFilmDone] = useState(!ENABLE_3D_EXPERIENCE)
  const [filmActive, setFilmActive] = useState(ENABLE_3D_EXPERIENCE)
  const [muted, setMuted] = useState(readMuted)
  // Whether the score has actually been unlocked by a gesture and decoded, as
  // opposed to merely being wanted — the toggle must not claim to be playing
  // something the browser has not let us start yet.
  const [audioReady, setAudioReady] = useState(false)
  const sequenceRef = useRef(null)
  const audioRef = useRef(null)

  /* ------------------------------------------------------------- load film */

  useEffect(() => {
    // Returning before boot() is what keeps the frames off the wire: the
    // manifest is never fetched, so no FrameSequence is built and nothing is
    // downloaded from either asset set.
    if (!ENABLE_3D_EXPERIENCE) return

    let cancelled = false

    const boot = async () => {
      try {
        const loaded = await loadManifest()
        if (cancelled) return

        const profile = isMobile ? 'mobile' : 'desktop'
        // The two renders drop different duplicate frames, so the count and
        // the frame map both come from the chosen variant, never from a shared
        // top-level value.
        const variant = resolveVariant(loaded, profile)
        const seq = new FrameSequence({
          basePath: variant.path,
          count: variant.count,
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

        setVariant(variant)
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

    // Crossing the breakpoint means a different render entirely, so the old
    // one is dropped before the new one primes: clearing `variant` unmounts
    // CinematicExperience, which disposes its WebGL stage and ticker, and the
    // cleanup below destroys the sequence that was feeding it. On first mount
    // these are already the initial values, so nothing extra happens.
    setVariant(null)
    setSequence(null)
    setProgress(0)
    setPhase('loading')

    boot()
    return () => {
      cancelled = true
      sequenceRef.current?.destroy()
      sequenceRef.current = null
    }
  }, [isMobile])

  /* ------------------------------------------------------------- the score */

  const showFilm = phase === 'ready' || phase === 'leaving'

  useEffect(() => {
    // The score plays under the film and nowhere else, so with the film off it
    // is not merely silent — it is never armed, and the track is never fetched.
    if (!ENABLE_3D_EXPERIENCE || !sound.enabled || !FilmAudio.supported) return

    const audio = new FilmAudio(sound)
    audioRef.current = audio

    // Browsers only grant audio on a real gesture, and scrolling is not one —
    // so we wait for the first tap, click or key rather than trying to start
    // the score with the film and being silently refused.
    let cancelled = false
    const arm = () => {
      audio.arm().then((ok) => {
        if (ok && !cancelled) setAudioReady(true)
      })
    }
    const events = ['pointerdown', 'touchend', 'keydown']
    for (const type of events) window.addEventListener(type, arm, { passive: true })

    const onVisibility = () => audio.setHidden(document.visibilityState !== 'visible')
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      for (const type of events) window.removeEventListener(type, arm)
      document.removeEventListener('visibilitychange', onVisibility)
      audio.destroy()
      audioRef.current = null
    }
  }, [])

  // The score belongs to the film, so it leaves with it.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (showFilm && filmActive) audio.play()
    else audio.stop()
  }, [showFilm, filmActive])

  useEffect(() => {
    audioRef.current?.setMuted(muted)
    writeMuted(muted)
  }, [muted])

  /* ------------------------------------------------- scroll lock + smoothing */

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

      {sound.enabled && FilmAudio.supported && showFilm && filmActive && (
        <button
          type="button"
          className="soundtoggle"
          // The pointerdown that opens this button is itself the gesture that
          // unlocks the score, so the first press must not also mute it.
          onClick={() => (audioReady ? setMuted((m) => !m) : setMuted(false))}
          aria-pressed={audioReady && !muted}
          aria-label={audioReady && !muted ? 'Turn the music off' : 'Turn the music on'}
        >
          <span
            className="soundtoggle__bars"
            data-playing={audioReady && !muted}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="soundtoggle__label">
            {audioReady && !muted ? 'Music on' : 'Music off'}
          </span>
        </button>
      )}

      <Nav visible={filmDone && !filmActive} />

      <main className="page">
        {/* The run-up to the film: opening lines, the two cities, the
            announcement, the couple. Sits above the pinned stage and does not
            reach into it. */}
        <Prologue reducedMotion={reducedMotion} />

        {showFilm && sequence && variant && (
          /* No fallback: the loader is still on screen at this point, and the
             chunk arrives alongside frames that are already primed. */
          <Suspense fallback={null}>
            <CinematicExperience
              variant={variant}
              sequence={sequence}
              isMobile={isMobile}
              reducedMotion={reducedMotion}
              onFinish={onFilmFinish}
              onActiveChange={setFilmActive}
            />
          </Suspense>
        )}

        <div className="invitation">
          <Hero />
          <Countdown />
          <Events />
          <Venue />
          <Couple />
          <Rsvp />
          <Footer />
        </div>
      </main>
    </>
  )
}
