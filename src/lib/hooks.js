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
 * Which asset set to serve — the portrait render or the landscape one.
 * Decided once on mount and deliberately not re-evaluated on resize, because
 * swapping the frame set mid-film would throw away everything already
 * downloaded. That is also why this cannot be a CSS media query.
 *
 * Size alone is not enough to identify a phone. The test is against the
 * viewport, and browser chrome costs about 110px of height, so a 1366x768
 * laptop reports 1366x657 and a 1440x900 MacBook reports 1440x790 — both under
 * any sensible small-side threshold, and both were being served the portrait
 * film. Requiring a coarse, hoverless pointer settles it: that is true of
 * phones and tablets, false of every laptop, and true under device emulation
 * in devtools.
 *
 * Size still decides among touch devices, so a large tablet keeps the
 * landscape film while a phone gets the portrait one, in either orientation.
 *
 * A narrow window counts as mobile whatever it is pointed at, which is the
 * plain max-width:768px reading and makes a resized desktop browser behave the
 * way anyone testing responsiveness expects. That test is on width alone, not
 * on the smaller side: laptop viewports are at least 1024 wide, so it cannot
 * catch one the way a min(width, height) test did.
 */
export function useDeviceProfile() {
  return useMemo(() => {
    if (typeof window === 'undefined') return { isMobile: false, isTouch: false }
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const isNarrow = window.innerWidth <= 768
    const isSmall = Math.min(window.innerWidth, window.innerHeight) <= 820
    const lowMemory = (navigator.deviceMemory ?? 8) <= 4
    return { isMobile: isNarrow || (isTouch && (isSmall || lowMemory)), isTouch }
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
