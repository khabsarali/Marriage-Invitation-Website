import { useReveal } from '../../lib/hooks.js'
import { stillsVersion } from '../../config/stills.generated.js'

/** Fades and lifts its children the first time they enter the viewport. */
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const [ref, visible] = useReveal()
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** A fine gold rule with a small diamond at its centre. */
export function Ornament({ className = '' }) {
  return (
    <span className={`ornament ${className}`.trim()} aria-hidden="true">
      <span className="ornament__rule" />
      <svg viewBox="0 0 24 24" className="ornament__mark">
        <path d="M12 2.5 15.5 12 12 21.5 8.5 12z" />
        <path d="M2.5 12 12 8.5 21.5 12 12 15.5z" opacity=".55" />
      </svg>
      <span className="ornament__rule" />
    </span>
  )
}

export function SectionHeading({ kicker, title, intro, id }) {
  return (
    <header className="section__head">
      {kicker && (
        <Reveal as="p" className="section__kicker">
          {kicker}
        </Reveal>
      )}
      <Reveal as="h2" className="section__title" id={id} delay={60}>
        {title}
      </Reveal>
      <Reveal delay={120}>
        <Ornament />
      </Reveal>
      {intro && (
        <Reveal as="p" className="section__intro" delay={160}>
          {intro}
        </Reveal>
      )}
    </header>
  )
}

/** Standard section shell — keeps rhythm and anchor ids consistent. */
export function Section({ id, className = '', children, label }) {
  return (
    <section id={id} className={`section ${className}`.trim()} aria-label={label}>
      <div className="section__inner">{children}</div>
    </section>
  )
}

/**
 * A still lifted from the film.
 *
 * Phones are served the cut from the portrait render and everything else the
 * cut from the landscape one. The browser resolves <source media> before it
 * fetches anything, so exactly one of the two is downloaded — a phone never
 * requests, let alone shows, a frame from the desktop plate.
 *
 * The breakpoint matches the one the frame loader uses in hooks.js, so the
 * stills and the film always agree about which render a device is on.
 */
export function Still({ src, alt, className, width, height, ...rest }) {
  // One version for the whole still set, regenerated only when a still's bytes
  // change. These filenames are readable and referenced from the config, so
  // they cannot carry the hash in the path the way the film frames do — but an
  // unversioned URL whose content changes is exactly how a stale image survives
  // a redeploy, which is what happened to the frames.
  const v = `?v=${stillsVersion}`
  return (
    <picture>
      <source
        media="(max-width: 768px)"
        srcSet={src.replace('/stills/', '/stills/mobile/') + v}
        type="image/webp"
      />
      <img
        src={src + v}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        {...rest}
      />
    </picture>
  )
}
