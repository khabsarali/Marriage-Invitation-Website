import { useEffect, useMemo, useRef, useState } from 'react'

/** Matches a media query, and stays in sync when the viewport changes. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** The one breakpoint in the project. 768 and under is the portrait film. */
export const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`

/**
 * Which render to serve — the 9:16 portrait one or the 16:9 landscape one.
 *
 * Width alone, through matchMedia. Earlier revisions also weighed pointer type
 * and the smaller side of the viewport, which went wrong in both directions:
 * a `min(width, height)` test caught laptops, because browser chrome drops a
 * 1366x768 laptop to 1366x657, and a pointer test then missed a desktop window
 * dragged narrow. A single width rule is what the breakpoint actually means
 * and is what devtools emulation reproduces.
 *
 * It follows the breakpoint live rather than sampling once on mount, so
 * dragging a window across 768 switches renders. `change` only fires when the
 * query flips, so a phone collapsing its address bar — which moves height, not
 * width — never triggers a reload of the sequence.
 *
 * The tradeoff is that a phone turned landscape is over 768 wide and takes the
 * landscape film. That suits the shape of the screen it is now, and it is the
 * literal meaning of the breakpoint.
 */
export function useDeviceProfile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(MOBILE_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = (event) => setIsMobile(event.matches)
    setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return { isMobile }
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** Live countdown to an ISO timestamp. */
export function useCountdown(iso) {
  const target = useMemo(() => new Date(iso).getTime(), [iso])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  const second = 1000
  const minute = 60 * second
  const hour = 60 * minute
  const day = 24 * hour

  return {
    days: Math.floor(diff / day),
    hours: Math.floor((diff % day) / hour),
    minutes: Math.floor((diff % hour) / minute),
    seconds: Math.floor((diff % minute) / second),
    passed: diff === 0,
  }
}

/**
 * Slow vertical drift for something behind type — the hero plate, a skyline,
 * the closing wash.
 *
 * Deliberately not GSAP/ScrollTrigger. Parallax is the only scroll-driven
 * effect left on the site now that the film is off, and it is one transform on
 * one element; doing it here keeps GSAP out of the bundle every visitor
 * downloads. It writes a `--parallax` percentage the stylesheet applies, so the
 * element keeps whatever transform CSS gives it.
 *
 * Only runs while the element is near the viewport, and never under
 * `prefers-reduced-motion`.
 */
export function useParallax({ from = -5, to = 5, disabled = false } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || disabled) return

    let frame = 0
    let near = false

    const apply = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // 0 as the element's top reaches the bottom of the screen, 1 as its
      // bottom leaves the top — so the drift is spread over the whole pass.
      const span = vh + rect.height
      const raw = (vh - rect.top) / span
      const t = raw < 0 ? 0 : raw > 1 ? 1 : raw
      el.style.setProperty('--parallax', `${(from + (to - from) * t).toFixed(3)}%`)
    }

    const onScroll = () => {
      if (near && !frame) frame = requestAnimationFrame(apply)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting
        if (near) onScroll()
      },
      { rootMargin: '150px 0px' }
    )
    io.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    apply()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
      el.style.removeProperty('--parallax')
    }
  }, [from, to, disabled])

  return ref
}

/** True once the page has scrolled past `offset` — used to settle the nav. */
export function useScrolledPast(offset = 80) {
  const [past, setPast] = useState(false)

  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      setPast(window.scrollY > offset)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [offset])

  return past
}

/** Adds `is-visible` the first time an element scrolls into view. */
export function useReveal(options) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: options?.rootMargin ?? '0px 0px -12% 0px', threshold: options?.threshold ?? 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.rootMargin, options?.threshold])

  return [ref, visible]
}
