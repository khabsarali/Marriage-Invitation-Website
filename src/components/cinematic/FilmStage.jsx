import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import StoryLoader from '../loader/StoryLoader.jsx'
import { FrameSequence } from '../../lib/FrameSequence.js'
import { FilmAudio } from '../../lib/FilmAudio.js'
import { loadManifest, resolveVariant } from '../../lib/manifest.js'
import { loading, sound } from '../../config/scenes.config.js'

/**
 * Everything the scroll-driven film needs to exist: the frame loader, the score,
 * its own loading screen and the WebGL stage.
 *
 * This used to live in App.jsx. It was lifted out when the invitation was
 * redesigned so that App holds only the invitation, and so that switching the
 * film off costs a visitor nothing at all: App renders this behind
 * ENABLE_3D_EXPERIENCE *and* behind a dynamic import, so with the switch off the
 * module is never fetched — and with it, three.js, GSAP, the frame loader, the
 * score and film.css are all absent from the page rather than merely unused.
 *
 * The switch therefore still works exactly as documented in scenes.config.js:
 * set it to true and the film returns, mounted between the hero and the rest of
 * the invitation, with nothing else to change. Two things worth knowing if you
 * do:
 *
 *   · The page's own Preloader (the envelope) opens first and is quick; this
 *     component's StoryLoader then holds the page while frames prime.
 *   · The redesigned invitation no longer fades its ivory ground into the film's
 *     black, so the hand-over will want a look at.
 */
const CinematicExperience = lazy(() => import('./CinematicExperience.jsx'))

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

export default function FilmStage({ isMobile, reducedMotion, onDone }) {
  const [variant, setVariant] = useState(null)
  const [sequence, setSequence] = useState(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading') // loading | leaving | ready | filmless
  const [filmActive, setFilmActive] = useState(true)
  const [muted, setMuted] = useState(readMuted)
  // Whether the score has actually been unlocked by a gesture and decoded, as
  // opposed to merely being wanted — the toggle must not claim to be playing
  // something the browser has not let us start yet.
  const [audioReady, setAudioReady] = useState(false)
  const sequenceRef = useRef(null)
  const audioRef = useRef(null)

  /* ------------------------------------------------------------- load film */

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        const loaded = await loadManifest()
        if (cancelled) return

        const profile = isMobile ? 'mobile' : 'desktop'
        // The two renders drop different duplicate frames, so the count and the
        // frame map both come from the chosen variant, never from a shared
        // top-level value.
        const picked = resolveVariant(loaded, profile)
        const seq = new FrameSequence({
          basePath: picked.path,
          count: picked.count,
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

        setVariant(picked)
        setSequence(seq)
        setPhase('leaving')
        setTimeout(() => !cancelled && setPhase('ready'), 900)
      } catch (err) {
        console.error('[invitation] the film could not be loaded', err)
        if (!cancelled) {
          setPhase('filmless')
          setFilmActive(false)
          onDone?.()
        }
      }
    }

    // Crossing the breakpoint means a different render entirely, so the old one
    // is dropped before the new one primes.
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
  }, [isMobile, onDone])

  /* ------------------------------------------------------------- the score */

  const showFilm = phase === 'ready' || phase === 'leaving'

  useEffect(() => {
    if (!sound.enabled || !FilmAudio.supported) return

    const audio = new FilmAudio(sound)
    audioRef.current = audio

    // Browsers only grant audio on a real gesture, and scrolling is not one — so
    // we wait for the first tap, click or key rather than trying to start the
    // score with the film and being silently refused.
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

  /* ------------------------------------------------- scroll lock + ScrollTrigger */

  useEffect(() => {
    const locked = phase === 'loading'
    document.body.classList.toggle('is-locked', locked)
    if (locked) window.scrollTo(0, 0)
    return () => document.body.classList.remove('is-locked')
  }, [phase])

  // App owns Lenis; the pinned stage needs ScrollTrigger to hear about its
  // scroll rather than the window's.
  useEffect(() => {
    const lenis = window.lenis
    if (!lenis) return
    const update = () => ScrollTrigger.update()
    lenis.on('scroll', update)
    ScrollTrigger.refresh()
    return () => lenis.off('scroll', update)
  }, [phase])

  const skip = useCallback(() => {
    setPhase('filmless')
    setFilmActive(false)
    sequenceRef.current?.destroy()
    sequenceRef.current = null
    setSequence(null)
    onDone?.()
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [onDone])

  const onFinish = useCallback(() => onDone?.(), [onDone])

  return (
    <>
      {(phase === 'loading' || phase === 'leaving') && (
        <StoryLoader progress={progress} leaving={phase === 'leaving'} failed={false} onSkip={skip} />
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
          <span className="soundtoggle__bars" data-playing={audioReady && !muted} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="soundtoggle__label">{audioReady && !muted ? 'Music on' : 'Music off'}</span>
        </button>
      )}

      {showFilm && sequence && variant && (
        <Suspense fallback={null}>
          <CinematicExperience
            variant={variant}
            sequence={sequence}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            onFinish={onFinish}
            onActiveChange={setFilmActive}
          />
        </Suspense>
      )}
    </>
  )
}
