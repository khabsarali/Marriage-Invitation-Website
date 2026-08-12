import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { createStage, driftBudget } from '../../lib/CinematicRenderer.js'
import { FrameSequence } from '../../lib/FrameSequence.js'
import { toSourceFrame } from '../../lib/manifest.js'
import {
  SOURCE_COUNT,
  beats,
  sceneBeats,
  finaleTitle,
  gradeAt,
  loading,
  scroll,
} from '../../config/scenes.config.js'
import { coupleNames, invitation } from '../../config/wedding.config.js'

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Ramps 0 -> 1 -> 0 across a window, with soft shoulders. */
function envelope(value, from, to, shoulder) {
  if (value <= from || value >= to) return 0
  const inRamp = clamp01((value - from) / shoulder)
  const outRamp = clamp01((to - value) / shoulder)
  const t = Math.min(inRamp, outRamp)
  return t * t * (3 - 2 * t)
}

/**
 * The pinned, scroll-driven film.
 *
 * Scroll position -> a smoothed playhead -> one frame of the sequence, drawn
 * through the cinematic shader. Overlays (captions, chapter rail, veil) are
 * written straight to the DOM from the same rAF tick rather than through React
 * state, so the whole experience costs one render pass per frame.
 */
export default function CinematicExperience({
  manifest,
  sequence,
  isMobile,
  reducedMotion,
  onFinish,
  onActiveChange,
}) {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const veilRef = useRef(null)
  const hintRef = useRef(null)
  const finaleRef = useRef(null)
  const captionRefs = useRef({})
  const railRefs = useRef({})
  const railFillRef = useRef(null)

  const captionBeats = useMemo(() => sceneBeats.filter((b) => b.caption?.title), [])

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!section || !stage || !canvas || !manifest || !sequence) return

    const profile = isMobile ? 'mobile' : 'desktop'
    const filmPixels = SOURCE_COUNT * scroll.pixelsPerFrame[profile]
    const outroPixels = scroll.outroPixels[profile]
    const totalPixels = filmPixels + outroPixels
    const filmSpan = filmPixels / totalPixels

    const gl = createStage(canvas, {
      maxPixels: isMobile ? 1_500_000 : 2_400_000,
      dustCount: isMobile ? 180 : 420,
      texturePool: isMobile ? 5 : 7,
    })

    /* ------------------------------------------------------------- sizing */

    let viewWidth = 0
    let viewHeight = 0

    const resize = () => {
      const rect = stage.getBoundingClientRect()
      viewWidth = Math.max(1, Math.round(rect.width))
      viewHeight = Math.max(1, Math.round(rect.height))
      gl.resize(viewWidth, viewHeight, Math.min(window.devicePixelRatio || 1, 2))
    }
    resize()

    /* ------------------------------------------------------- scroll driver */

    let target = 0
    let smooth = 0
    let lastIndex = -1
    let direction = 1
    let finished = false

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${totalPixels}`,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        target = self.progress
        direction = self.direction
      },
      onLeave: () => {
        if (!finished) {
          finished = true
          onFinish?.()
        }
      },
      // Lets the invitation's nav bar get out of the way if the guest scrolls
      // back up into the film.
      onToggle: (self) => onActiveChange?.(self.isActive),
    })

    /* ------------------------------------------------ pointer parallax only */

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    if (!isMobile) window.addEventListener('pointermove', onPointerMove, { passive: true })

    /* ---------------------------------------------------------- the ticker */

    const ease = scroll.ease[profile]
    let reveal = 0
    let running = true

    const setCaptions = (sourceFrame) => {
      for (const beat of captionBeats) {
        const node = captionRefs.current[beat.id]
        if (!node) continue
        const { showFrom, showTo } = beat.caption
        const a = envelope(sourceFrame, showFrom, showTo, (showTo - showFrom) * 0.34)
        node.style.opacity = a.toFixed(3)
        node.style.transform = `translate3d(0, ${((1 - a) * 26).toFixed(2)}px, 0)`
        node.style.visibility = a < 0.002 ? 'hidden' : 'visible'
      }

      const finaleNode = finaleRef.current
      if (finaleNode) {
        const a = clamp01((sourceFrame - finaleTitle.showFrom) / (finaleTitle.showTo - finaleTitle.showFrom))
        const eased = a * a * (3 - 2 * a)
        finaleNode.style.opacity = eased.toFixed(3)
        finaleNode.style.transform = `translate3d(0, ${((1 - eased) * 30).toFixed(2)}px, 0)`
        finaleNode.style.visibility = eased < 0.002 ? 'hidden' : 'visible'
      }
    }

    const setRail = (sourceFrame, progress) => {
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${clamp01(progress / filmSpan).toFixed(4)})`
      }
      for (const beat of sceneBeats) {
        const node = railRefs.current[beat.id]
        if (!node) continue
        const active = sourceFrame >= beat.from - 6 && sourceFrame <= beat.to + 6
        node.dataset.active = active ? 'true' : 'false'
      }
    }

    // gsap.ticker hands us elapsed seconds and the delta in milliseconds.
    const tick = (t, deltaMs) => {
      if (!running) return
      const dt = Math.min(0.1, Math.max(0, deltaMs / 1000))

      // Frame-rate independent smoothing: `ease` is the per-tick catch-up at
      // 60 Hz, rescaled so 120 Hz and dropped frames feel identical.
      const k = 1 - Math.pow(1 - ease, dt * 60)
      smooth += (target - smooth) * (reducedMotion ? 1 : k)
      if (Math.abs(target - smooth) < 0.00005) smooth = target

      const filmT = clamp01(smooth / filmSpan)
      const outFloat = filmT * (manifest.count - 1)
      const index = Math.round(outFloat)
      const sourceFrame = toSourceFrame(manifest, outFloat)

      if (index !== lastIndex) {
        lastIndex = index
        sequence.setPlayhead(index, direction)
      }

      const grade = gradeAt(sourceFrame, isMobile)
      const sample = sequence.sample(outFloat)

      // Outro: the last frame holds while the film pushes in and dissolves.
      const outro = clamp01((smooth - filmSpan) / (1 - filmSpan))
      const outroEase = outro * outro
      const zoom = grade.zoom * (1 + outroEase * 0.05)

      const budget = driftBudget(viewWidth / viewHeight, zoom)
      const wobbleX = Math.sin(t * 0.13) * 0.55 + pointer.x * 0.35
      const wobbleY = Math.cos(t * 0.11) * 0.45 + pointer.y * 0.28
      const drift = reducedMotion ? 0 : grade.drift

      reveal += ((sample ? 1 : 0) - reveal) * Math.min(1, dt * 3.5)

      gl.draw({
        sample,
        grade: {
          ...grade,
          zoom,
          bloom: grade.bloom + outroEase * 0.25,
          blur: grade.blur + outroEase * 0.35,
          vignette: grade.vignette + outroEase * 0.16,
        },
        offset: {
          x: budget.x * wobbleX * drift,
          y: budget.y * wobbleY * drift,
        },
        time: t,
        reveal,
        dust: {
          opacity: reducedMotion ? 0 : 0.55 * (1 - outroEase),
          parallaxX: pointer.x * 0.012,
          parallaxY: pointer.y * 0.01,
        },
      })

      setCaptions(sourceFrame)
      setRail(sourceFrame, smooth)

      if (veilRef.current) {
        const veil = clamp01((smooth - filmSpan - (1 - filmSpan) * 0.18) / ((1 - filmSpan) * 0.62))
        veilRef.current.style.opacity = (veil * veil * (3 - 2 * veil)).toFixed(3)
      }
      if (hintRef.current) {
        const hint = 1 - clamp01(smooth / 0.02)
        hintRef.current.style.opacity = hint.toFixed(3)
        hintRef.current.style.visibility = hint < 0.01 ? 'hidden' : 'visible'
      }
    }

    gsap.ticker.add(tick)

    /* ----------------------------------------------------------- lifecycle */

    const onResize = () => {
      resize()
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running) gsap.ticker.add(tick)
      else gsap.ticker.remove(tick)
    }
    document.addEventListener('visibilitychange', onVisibility)

    sequence.startBackgroundFill()

    return () => {
      running = false
      gsap.ticker.remove(tick)
      trigger.kill()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.dispose()
    }
  }, [manifest, sequence, isMobile, reducedMotion, onFinish, onActiveChange, captionBeats])

  const skip = () => {
    const section = sectionRef.current
    if (!section) return
    const end = section.offsetTop + section.offsetHeight
    window.lenis ? window.lenis.scrollTo(end, { duration: 1.4 }) : window.scrollTo({ top: end, behavior: 'smooth' })
  }

  return (
    <section className="cinematic" ref={sectionRef} aria-label="The wedding film">
      <div className="cinematic__stage" ref={stageRef}>
        <canvas className="cinematic__canvas" ref={canvasRef} aria-hidden="true" />
        <div className="cinematic__edge" aria-hidden="true" />

        <div className="cinematic__captions">
          {captionBeats.map((beat) => (
            <figure
              key={beat.id}
              className="chapter"
              ref={(node) => {
                captionRefs.current[beat.id] = node
              }}
            >
              <span className="chapter__kicker">{beat.caption.kicker}</span>
              <h2 className="chapter__title">{beat.caption.title}</h2>
              <figcaption className="chapter__subtitle">{beat.caption.subtitle}</figcaption>
            </figure>
          ))}

          <div className="finale" ref={finaleRef}>
            <span className="finale__kicker">{invitation.kicker}</span>
            <h2 className="finale__names">
              <span>{coupleNames[0]}</span>
              <span className="finale__amp">&amp;</span>
              <span>{coupleNames[1]}</span>
            </h2>
            <span className="finale__hint">Keep scrolling for the invitation</span>
          </div>
        </div>

        <nav className="rail" aria-label="Film chapters">
          <span className="rail__track" aria-hidden="true">
            <span className="rail__fill" ref={railFillRef} />
          </span>
          <ul className="rail__list">
            {sceneBeats.map((beat) => (
              <li
                key={beat.id}
                className="rail__item"
                data-active="false"
                ref={(node) => {
                  railRefs.current[beat.id] = node
                }}
              >
                <span className="rail__dot" aria-hidden="true" />
                <span className="rail__label">{beat.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="cinematic__hint" ref={hintRef}>
          <span className="cinematic__hint-text">Scroll to begin our story</span>
          <span className="cinematic__hint-line" aria-hidden="true" />
        </div>

        <button type="button" className="cinematic__skip" onClick={skip}>
          Skip to the invitation
        </button>

        <div className="cinematic__veil" ref={veilRef} aria-hidden="true" />
      </div>
    </section>
  )
}
