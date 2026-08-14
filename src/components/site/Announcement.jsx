import { Reveal, MaskLines, Rule } from './primitives.jsx'
import { announcement } from '../../config/wedding.config.js'

/**
 * Type and air, and nothing else — no card, no border, no image.
 *
 * The four lines are the four sizes: the hosts small and tracked, the lead-in
 * italic, the two words of the announcement at full display scale, and the
 * relation italic again. It ends on "of their beloved grand daughter", which
 * hands straight over to her name in the next section; that is why the couple
 * reveal follows this and not the other way round.
 */
export default function Announcement() {
  return (
    <section className="section section--paper announce" aria-label="The announcement">
      <div className="section__inner announce__inner">
        <Reveal as="p" className="announce__hosts">
          {announcement.hosts}
        </Reveal>

        <Reveal delay={100}>
          <Rule tight />
        </Reveal>

        <Reveal as="p" className="announce__lead" delay={180}>
          {announcement.lead}
        </Reveal>

        <MaskLines
          as="h2"
          className="announce__heading"
          lines={announcement.headingLines}
          delay={280}
          step={160}
        />

        <Reveal as="p" className="announce__relation" delay={620}>
          {announcement.relation}
        </Reveal>
      </div>
    </section>
  )
}
