import { Reveal, MaskLines } from './primitives.jsx'
import { couple, coupleNames, invitation } from '../../config/wedding.config.js'

/**
 * The emotional centre: her name, the word between, his name — arriving one at a
 * time, slowly, on the darkest ground on the site.
 *
 * The names are stacked rather than set side by side so that each one lands
 * alone, and the verse sits underneath at a fraction of their size, which is
 * what keeps them the loudest thing here.
 *
 * A photograph would go between the names and the verse. There is none: see the
 * note on `couple.bride.image` in wedding.config.js. Set a path there and this
 * renders it; until then the section is type, which is a deliberate choice
 * rather than a gap — a wedding invitation with no photograph on it is normal,
 * and one with the wrong photograph on it is not.
 */
function Portrait({ person }) {
  if (!person.image) return null
  return (
    <Reveal className="couple__frame" delay={200}>
      <img
        src={person.image}
        alt={person.fullName}
        width="672"
        height="840"
        loading="lazy"
        decoding="async"
      />
    </Reveal>
  )
}

export default function CoupleReveal() {
  const [first, second] = couple.order.map((key) => couple[key])

  return (
    <section className="section section--ink couple" id="couple" aria-label="Radia with Umar">
      <div className="section__inner couple__inner">
        <MaskLines
          as="h2"
          className="couple__names"
          lines={[coupleNames[0]]}
          delay={80}
        />
        <Reveal as="p" className="couple__joiner" delay={520}>
          {couple.joiner}
        </Reveal>
        <MaskLines
          as="p"
          className="couple__names couple__names--second"
          lines={[coupleNames[1]]}
          delay={760}
        />

        {(first.parents || second.parents) && (
          <Reveal as="p" className="couple__parents" delay={900}>
            {[first.parents, second.parents].filter(Boolean).join(' · ')}
          </Reveal>
        )}

        <Portrait person={first} />
        <Portrait person={second} />

        <figure className="couple__verse">
          <Reveal as="blockquote" delay={1000}>
            {invitation.verse}
          </Reveal>
          <Reveal as="figcaption" delay={1100}>
            {invitation.verseSource}
          </Reveal>
        </figure>
      </div>
    </section>
  )
}
