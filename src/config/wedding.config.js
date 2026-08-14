/* ==========================================================================
   WEDDING CONFIGURATION — this is the only file you need to edit.
   Every name, date, time, venue and link on the site is read from here.
   Nothing below is hardcoded anywhere else in the codebase.

   Anything not yet supplied is left as `null` rather than guessed. The
   components render "Details to follow" in its place, so a placeholder can
   never be mistaken for a real date or address.
   ========================================================================== */

export const couple = {
  bride: {
    name: 'Radia',
    fullName: 'Radia',
    /** Shown in the couple section. null hides the line. */
    parents: null,
    words: null,
    image: '/portraits/radia.webp',
  },
  groom: {
    name: 'Umar',
    fullName: 'Umar',
    parents: null,
    words: null,
    // No photograph supplied yet. The card is omitted rather than filled
    // with a frame from the film.
    image: null,
  },
  /** Order the names appear as — matches the RU monogram. */
  order: ['bride', 'groom'],
  /** The word set between the two names in the couple reveal. */
  joiner: 'with',
  hashtag: null,
}

/* --------------------------------------------------------------------------
   The cinematic opening, before the film. Each line lands on its own.
   -------------------------------------------------------------------------- */
export const prologue = {
  lines: ['A Royal Celebration of Love', 'A Date With Destiny', 'When Dubai Meets Karachi'],
  /** Shown as the film takes over. */
  filmCue: 'And so, their celebration begins…',
}

/* --------------------------------------------------------------------------
   The two cities the celebration spans.

   `image` is a path under public/. Leave it null and the section renders its
   own composed plate instead, so the layout, parallax and type are already
   final — dropping a photograph in later needs no code change.
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
    image: null, // e.g. '/city/dubai.webp'
    imageAlt: 'Dubai at dusk',
    /** Drives the placeholder plate's palette until a photograph replaces it. */
    tone: ['#1c1a24', '#3a3140', '#c9a45f'],
  },
  {
    id: 'karachi',
    name: 'Karachi',
    dates: '6th – 8th',
    month: 'January',
    year: '2027',
    startISO: '2027-01-06T00:00:00+05:00',
    image: null, // e.g. '/city/karachi.webp'
    imageAlt: 'The Karachi coastline at sunset',
    tone: ['#1b1f22', '#33403f', '#d9bd85'],
  },
]

/* --------------------------------------------------------------------------
   The announcement itself.
   -------------------------------------------------------------------------- */
export const announcement = {
  hosts: 'Younus Abdul Karim & Makia Younus',
  lead: 'Joyfully announce the',
  heading: 'Wedding Celebrations',
  relation: 'Of their beloved grand daughter',
}

export const invitation = {
  blessing: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  kicker: 'Together with their families',
  request: 'request the pleasure of your presence at the celebration of their wedding',
  verse:
    '“And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquillity with them, and He has put love and mercy between your hearts.”',
  verseSource: 'Surah Ar-Rum, 30:21',
}

/* --------------------------------------------------------------------------
   The countdown counts to the first day of the celebrations, in Dubai.
   Format: ISO 8601 with the timezone offset, so it is correct everywhere.
   -------------------------------------------------------------------------- */
export const weddingDate = {
  iso: cities[0].startISO,
  weekday: 'Wednesday',
  day: '16',
  month: 'December',
  year: '2026',
  /** Shown under the countdown. */
  note: 'Dubai, and then Karachi in the new year.',
}

/* --------------------------------------------------------------------------
   Events. `scene` links a card to its chapter of the film, which supplies the
   card's still image. Dates, times and venues are not yet settled — they stay
   null until supplied, and are never invented.
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

/** Copy used wherever a detail has not been supplied yet. */
export const tbc = {
  short: 'To be announced',
  long: 'Details to follow',
}

export const gallery = {
  heading: 'Moments',
  intro: 'Stills from our story.',
}

export const rsvp = {
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

export const contacts = []

export const site = {
  title: 'Radia & Umar — Wedding Celebrations',
  description:
    'Younus Abdul Karim & Makia Younus joyfully announce the wedding celebrations of their beloved grand daughter Radia, with Umar. Dubai, 16–27 December 2026. Karachi, 6–8 January 2027.',
  family: 'Abdul Karim Family',
  followUp: 'Formal invitation to follow',
  footerNote: 'We cannot wait to celebrate with you.',
}

/** The monogram, built by `npm run logo` from brand/monogram.jpg. */
export const logo = {
  mark: '/brand/mark.webp',
  full: '/brand/logo.webp',
  alt: 'Radia & Umar',
}

/* -------------------------------------------------------------------------- */

export const coupleNames = couple.order.map((k) => couple[k].name)

export const mapsUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export const mapsEmbedUrl = (query) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

export const eventById = (id) => events.find((e) => e.id === id)
export const cityById = (id) => cities.find((c) => c.id === id)
