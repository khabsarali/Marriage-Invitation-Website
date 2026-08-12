import { useReveal } from '../../lib/hooks.js'

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
