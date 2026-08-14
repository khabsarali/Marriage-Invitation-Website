import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * A full-height city plate — Dubai, then Karachi — with its name and dates set
 * over it and the image drifting slowly behind as it passes.
 *
 * When `city.image` is null the plate composes itself from the city's own tone
 * instead of a photograph: layered light, a horizon and a scatter of window
 * lights. That is deliberate rather than a grey box, because it means the
 * layout, the parallax, the scrim and the type are already final. Dropping a
 * photograph into the config later changes nothing but the backdrop.
 *
 * The drift is one transform on one element, driven by the same ScrollTrigger
 * the film uses. `prefers-reduced-motion` skips it entirely.
 */
export default function CityPlate({ city, reducedMotion, eyebrow }) {
  const rootRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const layer = layerRef.current
    if (!root || !layer || reducedMotion) return

    const tween = gsap.fromTo(
      layer,
      { yPercent: -6, scale: 1.08 },
      {
        yPercent: 6,
        scale: 1.14,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [reducedMotion])

  const [deep, mid, light] = city.tone

  return (
    <section className="cityplate" ref={rootRef} aria-label={`${city.name}, ${city.month} ${city.year}`}>
      <div className="cityplate__layer" ref={layerRef}>
        {city.image ? (
          <img className="cityplate__photo" src={city.image} alt={city.imageAlt} loading="lazy" decoding="async" />
        ) : (
          /* Placeholder backdrop. Replace by setting `image` in the config. */
          <div
            className="cityplate__composed"
            aria-hidden="true"
            style={{ '--deep': deep, '--mid': mid, '--light': light }}
          >
            <span className="cityplate__glow" />
            <span className="cityplate__horizon" />
            <span className="cityplate__lights" />
          </div>
        )}
      </div>

      <div className="cityplate__scrim" aria-hidden="true" />

      <div className="cityplate__copy">
        {eyebrow && <p className="cityplate__eyebrow">{eyebrow}</p>}
        <h2 className="cityplate__name">{city.name}</h2>
        <p className="cityplate__dates">
          <span className="cityplate__days">{city.dates}</span>
          <span className="cityplate__rule" aria-hidden="true" />
          <span className="cityplate__month">
            {city.month} <span>{city.year}</span>
          </span>
        </p>
      </div>
    </section>
  )
}
