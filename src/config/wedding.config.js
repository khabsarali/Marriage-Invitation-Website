/* ==========================================================================
   WEDDING CONFIGURATION — this is the only file you need to edit.
   Every name, date, time, venue and link on the site is read from here.
   Nothing below is hardcoded anywhere else in the codebase.

   Anything not yet supplied is left as `null` rather than guessed. The
   components render "Details to follow" in its place, so a placeholder can
   never be mistaken for a real date or address.

   One further rule, and the reason the site reads the way it does: every fact
   below appears in exactly ONE place on the page. The names are the hero and
   the closing page. The two date ranges belong to the cities section and are
   set nowhere else. The hosts belong to the announcement. If a fact starts
   showing up twice, the second one is the mistake.
   ========================================================================== */

export const couple = {
  bride: {
    name: 'Radia',
    fullName: 'Radia',
    /** Shown under the name in the couple reveal. null hides the line. */
    parents: null,
    words: null,
    /**
     * A photograph for the couple reveal.
     *
     * Deliberately null. The one portrait in the project is a professional
     * headshot in a doctor's coat — a lovely photograph, and the wrong one for
     * a wedding invitation, where it fights the type rather than joining it.
     * The reveal is set in type alone until real engagement or wedding
     * photography exists, at which point a path here is all it takes:
     * `image: '/portraits/radia.webp'`.
     */
    image: null,
  },
  groom: {
    name: 'Umar',
    fullName: 'Umar',
    parents: null,
    words: null,
    // No photograph supplied yet. Nothing stands in for it.
    image: null,
  },
  /** Order the names appear as — matches the RU monogram. */
  order: ['bride', 'groom'],
  /** The word set between the two names in the couple reveal. */
  joiner: 'with',
  hashtag: null,
}

/* --------------------------------------------------------------------------
   The hero. Three lines, three sizes: the eyebrow above the names, the names
   themselves, and the two supporting lines beneath. This is the only place the
   names are set at full scale.

   `backdrop` is the photograph behind them — the two skylines across one
   stretch of water, which is the picture `crossing` names. One crop per
   orientation; see scripts/build-backdrop.mjs.
   -------------------------------------------------------------------------- */
export const hero = {
  eyebrow: 'A Royal Celebration of Love',
  destiny: 'A Date With Destiny',
  crossing: 'When Dubai Meets Karachi',
  scrollCue: 'Scroll',
  backdrop: {
    wide: '/backdrop/hero-wide.webp',
    tall: '/backdrop/hero-tall.webp',
    alt: 'The Karachi and Dubai skylines at night, facing each other across the water',
  },
}

/* --------------------------------------------------------------------------
   The two cities the celebration spans — and the one place their dates are
   printed.

   `image` is a path under public/. Leave it null and the panel draws the city
   as a fine engraved skyline instead, which is the intended design rather than
   a placeholder: engraved line work belongs to the same world as the printed
   invitation, where a stock photograph of a skyline does not. Setting `image`
   swaps the engraving for the photograph and changes nothing else.
   -------------------------------------------------------------------------- */
export const cities = [
  {
    id: 'dubai',
    name: 'Dubai',
    dates: '16th – 27th',
    month: 'December',
    year: '2026',
    /** Read by the countdown and by <time> elements. */
    startISO: '2026-12-16T00:00:00+04:00',
    /** Which engraving to draw. See components/site/Skyline.jsx. */
    skyline: 'dubai',
    image: null, // e.g. '/city/dubai.webp'
    imageAlt: 'Dubai at dusk',
  },
  {
    id: 'karachi',
    name: 'Karachi',
    dates: '6th – 8th',
    month: 'January',
    year: '2027',
    startISO: '2027-01-06T00:00:00+05:00',
    skyline: 'karachi',
    image: null, // e.g. '/city/karachi.webp'
    imageAlt: 'The Karachi coastline at sunset',
  },
]

/** Copy for the cities section. */
export const celebrations = {
  eyebrow: 'The Celebrations',
  heading: 'When Dubai Meets Karachi',
  /**
   * Where that heading breaks. Each line gets its own mask and its own beat as
   * it wipes up, so the break is a composition decision and belongs here rather
   * than being left to whatever width the browser happens to have.
   */
  headingLines: ['When Dubai', 'Meets Karachi'],
  /**
   * The closing line under the two panels. null and the rule goes with it —
   * the two cities and their dates say it without being told.
   */
  note: null,
}

/* --------------------------------------------------------------------------
   The announcement. Typography and whitespace, nothing else.
   -------------------------------------------------------------------------- */
export const announcement = {
  hosts: 'Younus Abdul Karim & Makia Younus',
  lead: 'Joyfully announce the',
  heading: 'Wedding Celebrations',
  /** As above: the two words carry a beat each. */
  headingLines: ['Wedding', 'Celebrations'],
  relation: 'Of their beloved grand daughter',
}

/**
 * The blessing opens the hero; the verse closes the couple reveal.
 *
 * "Together with their families…" and "request the pleasure of your presence…"
 * used to live here as well. Both are gone from the page: the hosts announce the
 * wedding in their own words in the section above, and a second, more general
 * request underneath it said the same thing twice. They are in git history if
 * they are ever wanted back.
 */
export const invitation = {
  blessing: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  verse:
    '“And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquillity with them, and He has put love and mercy between your hearts.”',
  verseSource: 'Surah Ar-Rum, 30:21',
}

/* --------------------------------------------------------------------------
   The countdown counts to the first day of the celebrations, in Dubai.
   Format: ISO 8601 with the timezone offset, so it is correct everywhere.
   The date itself is not repeated here — it is set in the cities section.
   -------------------------------------------------------------------------- */
export const weddingDate = {
  iso: cities[0].startISO,
  /** Shown under the countdown. */
  note: 'Dubai, and then Karachi in the new year.',
}

export const countdown = {
  eyebrow: 'Until we celebrate',
  today: 'Today is the day',
  note: weddingDate.note,
}

/* --------------------------------------------------------------------------
   The three evenings, as a timeline. Dates, times and venues are not settled
   yet, so they stay null until supplied, and are never invented.
   -------------------------------------------------------------------------- */
export const events = [
  {
    id: 'mehndi',
    scene: 'mehndi',
    name: 'Mehndi',
    tagline: 'An evening of henna, dhol and marigolds',
    city: null,
    date: null,
    dateISO: null,
    time: null,
    venue: null,
    address: null,
    mapQuery: null,
    dress: null,
    image: null,
  },
  {
    id: 'barat',
    scene: 'barat',
    name: 'Barat',
    tagline: 'The wedding ceremony & nikkah dinner',
    city: null,
    date: null,
    dateISO: null,
    time: null,
    venue: null,
    address: null,
    mapQuery: null,
    dress: null,
    image: null,
  },
  {
    id: 'walima',
    scene: 'walima',
    name: 'Walima',
    tagline: 'A reception hosted by the groom’s family',
    city: null,
    date: null,
    dateISO: null,
    time: null,
    venue: null,
    address: null,
    mapQuery: null,
    dress: null,
    image: null,
  },
]

export const eventsCopy = {
  eyebrow: 'Three Evenings',
  heading: 'The Order of Events',
  intro: 'Times and venues follow with the formal invitation.',
}

/** Copy used wherever a detail has not been supplied yet. */
export const tbc = {
  short: 'To be announced',
}

export const rsvp = {
  eyebrow: 'Response Card',
  heading: 'Will you be joining us?',
  intro: 'A formal invitation will follow. Do leave us a note in the meantime.',
  deadline: null,
  maxGuests: 8,
  /**
   * Where the form is delivered.
   *   endpoint  — optional POST url (Formspree, Getform, Basin, your own API…).
   *   whatsapp  — international format, digits only. null hides the button.
   *   email     — used for the mailto fallback. null hides it.
   */
  endpoint: null,
  whatsapp: null,
  email: null,
}

/* --------------------------------------------------------------------------
   Where to follow along. Each entry is `null` until a real account exists —
   the closing page omits the link rather than pointing at a dead handle.
   -------------------------------------------------------------------------- */
export const social = {
  instagram: {
    handle: '@radiawedsumar',
    url: 'https://www.instagram.com/radiawedsumar/',
  },
}

/**
 * `family` and `followUp` are read by the closing page. `title` and
 * `description` are the wording of the page's <title> and meta description —
 * index.html is a static file and cannot import this, so those two are kept in
 * step with it by hand.
 */
export const site = {
  title: 'Radia & Umar — Wedding Celebrations',
  description:
    'Younus Abdul Karim & Makia Younus joyfully announce the wedding celebrations of their beloved grand daughter Radia, with Umar. Dubai, 16–27 December 2026. Karachi, 6–8 January 2027.',
  family: 'Abdul Karim Family',
  followUp: 'Formal Invitation to follow',
}

/** The closing page. The last thing on the site, and the shortest. */
export const closing = {
  salutation: 'With love,',
  family: `The ${site.family}`,
  followUp: site.followUp,
}

/** The ambient plates. Built by `npm run stills`. */
export const stills = {
  chandeliers: '/stills/chandeliers.webp',
  roses: '/stills/roses.webp',
}

/**
 * The monogram, built by `npm run logo` from brand/monogram.jpg. `mark` is the
 * RU cypher on its own, which is what the site uses — the names are already set
 * in type wherever it appears. `full` is the same cypher with the names beneath
 * it, kept for print and for anywhere the lockup has to stand alone.
 */
export const logo = {
  mark: '/brand/mark.webp',
  full: '/brand/logo.webp',
  alt: 'Radia & Umar',
}

/** Shown under the monogram on the preloader. */
export const preloader = {
  line: hero.eyebrow,
}

/* -------------------------------------------------------------------------- */

export const coupleNames = couple.order.map((k) => couple[k].name)

/** Used by an evening's directions link, once that evening has a `mapQuery`. */
export const mapsUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
