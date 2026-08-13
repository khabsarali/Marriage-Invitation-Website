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
