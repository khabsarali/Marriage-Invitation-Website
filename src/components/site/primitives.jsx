import { useReveal } from '../../lib/hooks.js'

/**
 * The site's whole motion vocabulary lives in this file: things fade and rise
 * once, and display type wipes up from behind a mask. Nothing loops, nothing
 * floats, nothing moves after it has arrived.
 */

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

/**
 * Display type that wipes up from behind its own edge, one line at a time.
 *
 * `lines` is deliberately a list rather than a string with breaks in it: each
 * line needs its own mask and its own delay, and where a headline breaks is a
 * composition decision, not something to leave to the browser.
 */
export function MaskLines({ as: Tag = 'p', lines, className = '', delay = 0, step = 140, ...rest }) {
  const [ref, visible] = useReveal()
  return (
    <Tag ref={ref} className={`masked ${visible ? 'is-visible' : ''} ${className}`.trim()} {...rest}>
      {lines.map((line, i) => (
        <span className="masked__line" key={`${line}-${i}`}>
          <span className="masked__inner" style={{ transitionDelay: `${delay + i * step}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}

/**
 * A hairline with a small diamond at its centre — the one ornament on the site.
 * `tight` is the short version used inside a column of type; the default spans
 * a section.
 */
export function Rule({ className = '', tight = false }) {
  return (
    <span className={`rule${tight ? ' rule--tight' : ''} ${className}`.trim()} aria-hidden="true">
      <span className="rule__line" />
      <svg viewBox="0 0 24 24" className="rule__mark">
        <path d="M12 3 14.8 12 12 21 9.2 12z" />
      </svg>
      <span className="rule__line" />
    </span>
  )
}

/** The small tracked line that opens a section. */
export function Eyebrow({ children, className = '', delay = 0 }) {
  return (
    <Reveal as="p" className={`eyebrow ${className}`.trim()} delay={delay}>
      {children}
    </Reveal>
  )
}

/**
 * Section shell. `tone` picks the ground — paper, ivory or ink — which is how
 * the page keeps its rhythm without every section inventing its own layout.
 */
export function Section({ id, className = '', tone = 'paper', children, label }) {
  return (
    <section id={id} className={`section section--${tone} ${className}`.trim()} aria-label={label}>
      <div className="section__inner">{children}</div>
    </section>
  )
}
