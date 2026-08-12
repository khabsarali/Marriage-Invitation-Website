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

/**
 * Which asset set to serve. Decided once on mount and deliberately not
 * re-evaluated on resize — swapping the frame set mid-film would throw away
 * everything already downloaded.
 */
export function useDeviceProfile() {
  return useMemo(() => {
    if (typeof window === 'undefined') return { isMobile: false, isTouch: false }
    const isTouch = window.matchMedia('(hover: none)').matches
    const isSmall = Math.min(window.innerWidth, window.innerHeight) <= 820
    const lowMemory = (navigator.deviceMemory ?? 8) <= 4
    return { isMobile: isSmall || (isTouch && lowMemory), isTouch }
  }, [])
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
