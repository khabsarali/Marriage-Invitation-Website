/* ==========================================================================
   WEDDING CONFIGURATION — this is the only file you need to edit.
   Every name, date, time, venue, phone number and link on the site is read
   from here. Nothing below is hardcoded anywhere else in the codebase.

   >>> The values shipped here are PLACEHOLDERS. Replace them with the real
   >>> wedding details before publishing.
   ========================================================================== */

export const couple = {
  bride: {
    name: 'Ayesha',
    fullName: 'Ayesha Khan',
    // Shown in the couple section.
    parents: 'Daughter of Mr. & Mrs. Imran Khan',
    words: 'A quiet reader, a loud laugher, and the calm at the centre of every room she walks into.',
    image: '/stills/bride.webp',
  },
  groom: {
    name: 'Hamza',
    fullName: 'Hamza Ali',
    parents: 'Son of Mr. & Mrs. Tariq Ali',
    words: 'An early riser, a hopeless romantic, and the one who has been counting down since the day she said yes.',
    image: '/stills/groom.webp',
  },
  /** Order the names appear as, e.g. "Ayesha & Hamza". */
  order: ['bride', 'groom'],
  hashtag: '#AyeshaWedsHamza',
}

export const invitation = {
  kicker: 'Together with their families',
  request: 'request the pleasure of your presence at the celebration of their wedding',
  blessing: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  verse:
    '“And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquillity with them, and He has put love and mercy between your hearts.”',
  verseSource: 'Surah Ar-Rum, 30:21',
}

/* --------------------------------------------------------------------------
   The date the countdown counts down to — the main wedding day (Barat).
   Format: ISO 8601 with the timezone offset, so it is correct for guests
   in every country. +05:00 is Pakistan Standard Time.
   -------------------------------------------------------------------------- */
export const weddingDate = {
  iso: '2026-11-14T19:00:00+05:00',
  weekday: 'Saturday',
  day: '14',
  month: 'November',
  year: '2026',
}

/* --------------------------------------------------------------------------
   Events. `scene` links the card to its chapter of the cinematic film, which
   supplies the card's still image and accent colour.
   -------------------------------------------------------------------------- */
export const events = [
  {
    id: 'mehndi',
    scene: 'mehndi',
    name: 'Mehndi',
    tagline: 'An evening of henna, dhol and marigolds',
    weekday: 'Friday',
    date: '13 November 2026',
    dateISO: '2026-11-13T19:30:00+05:00',
    time: '7:30 PM onwards',
    venue: 'Bagh-e-Jinnah Lawn',
    address: 'Lawrence Road, Lahore, Punjab 54000, Pakistan',
    mapQuery: 'Bagh-e-Jinnah, Lawrence Road, Lahore',
    dress: 'Yellows, greens & florals',
    image: '/stills/mehndi-together.webp',
  },
  {
    id: 'barat',
    scene: 'barat',
    name: 'Barat',
    tagline: 'The wedding ceremony & nikkah dinner',
    weekday: 'Saturday',
    date: '14 November 2026',
    dateISO: '2026-11-14T19:00:00+05:00',
    time: '7:00 PM onwards',
    venue: 'Royal Palm Grand Hall',
    address: '52 Canal Bank Road, Lahore, Punjab 54600, Pakistan',
    mapQuery: 'Royal Palm Golf & Country Club, Canal Bank Road, Lahore',
    dress: 'Formal traditional',
    image: '/stills/barat-couple.webp',
  },
  {
    id: 'walima',
    scene: 'walima',
    name: 'Walima',
    tagline: 'A reception hosted by the groom’s family',
    weekday: 'Sunday',
    date: '15 November 2026',
    dateISO: '2026-11-15T19:00:00+05:00',
    time: '7:00 PM onwards',
    venue: 'The Grand Ballroom, Pearl Continental',
    address: 'Shahrah-e-Quaid-e-Azam, Lahore, Punjab 54000, Pakistan',
    mapQuery: 'Pearl Continental Hotel Lahore',
    dress: 'Formal',
    image: '/stills/walima-couple.webp',
  },
]

/** The venue given its own section — normally the main wedding day. */
export const primaryVenue = {
  eventId: 'barat',
  heading: 'The Wedding Venue',
  note: 'Valet parking is available at the main gate. The hall opens an hour before the ceremony begins.',
}

export const gallery = {
  heading: 'Moments',
  intro: 'Stills from our story.',
}

export const rsvp = {
  heading: 'Will you be joining us?',
  intro:
    'Kindly let us know before 1 November 2026 so we can keep a seat waiting for you.',
  deadline: '1 November 2026',
  maxGuests: 8,
  /**
   * Where the form is delivered.
   *   endpoint  — optional POST url (Formspree, Getform, Basin, your own API…).
   *               Leave null to skip the network call entirely.
   *   whatsapp  — international format, digits only. Used for the fallback
   *               "send us your reply" button. Set to null to hide it.
   *   email     — used for the mailto fallback. Set to null to hide it.
   */
  endpoint: null,
  whatsapp: '923001234567',
  email: 'rsvp@ayeshaandhamza.com',
}

export const contacts = [
  { name: 'Imran Khan', role: 'Father of the bride', phone: '+92 300 1234567' },
  { name: 'Tariq Ali', role: 'Father of the groom', phone: '+92 300 7654321' },
  { name: 'Sara Khan', role: 'Bride’s sister', phone: '+92 321 1112233' },
  { name: 'Bilal Ali', role: 'Groom’s brother', phone: '+92 321 4445566' },
]

export const site = {
  title: 'Ayesha & Hamza — Wedding Invitation',
  description:
    'Together with their families, Ayesha & Hamza request the pleasure of your presence. 13–15 November 2026, Lahore.',
  footerNote: 'We cannot wait to celebrate with you.',
}

/* -------------------------------------------------------------------------- */

export const coupleNames = couple.order.map((k) => couple[k].name)

export const mapsUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export const mapsEmbedUrl = (query) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

export const eventById = (id) => events.find((e) => e.id === id)
