import { Ornament } from './primitives.jsx'
import { coupleNames, site } from '../../config/wedding.config.js'

/**
 * Deliberately minimal: the two names, the family, and the promise of a formal
 * invitation. The contacts section that used to sit above this is gone with the
 * placeholder phone numbers it displayed — it can come back when real numbers
 * exist rather than standing empty.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <Ornament className="ornament--wide" />
        <p className="footer__names">
          {coupleNames[0]} <span>&amp;</span> {coupleNames[1]}
        </p>
        <p className="footer__family">{site.family}</p>
        <p className="footer__note">{site.followUp}</p>
      </div>
    </footer>
  )
}
