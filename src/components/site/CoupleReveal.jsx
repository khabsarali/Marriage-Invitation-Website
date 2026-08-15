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
 * The two portraits sit between the names and the verse — the one place on the
 * site they appear, and the only photographs of the couple anywhere in it. Both
 * are cut to the same 4:5 frame by `npm run portraits` so they read as a pair
 * rather than as two photographs that happen to be adjacent. They carry no
 * captions: the names are set at full scale directly above them.
 *
 * Either path can go back to null — see `couple.bride.image` in
 * wedding.config.js — and that side of the pair simply stops rendering.
 */
function Portrait({ person, delay }) {
  if (!person.image) return null
  return (
    <Reveal className="couple__frame" delay={delay}>
      <img
        src={person.image}
        alt={person.fullName}
        width="720"
        height="900"
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

        {(first.image || second.image) && (
          <div className="couple__pair">
            <Portrait person={first} delay={200} />
            <Portrait person={second} delay={340} />
          </div>
        )}

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
