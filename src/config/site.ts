/**
 * Every placeholder and business fact lives here. Pages read from this file
 * and never hardcode these values. `[TBD]` marks something still unknown.
 */
export const TBD = '[TBD]';

export const isSet = (value: string | undefined | null): value is string =>
  !!value && value !== TBD;

export const site = {
  url: 'https://vicsotheme.com',
  name: 'Viktor Sokoliuk',
  tagline: 'product engineer · EU',
  jobTitle: 'Product engineer',

  email: 'vic.sokoliuk@gmail.com',
  city: 'Tallinn',
  country: 'Estonia',
  countryCode: 'EE',
  companyName: TBD,
  bookingUrl: TBD,

  social: {
    linkedin: TBD,
    github: TBD,
  },

  /** Year the Hebrew app was first released (CaseHebrew hero). */
  heroYear: TBD,

  prices: {
    mvpPrototype: TBD,
    mvpMobile: TBD,
    mvpAi: TBD,
    ctoAdvisor: TBD,
    ctoPartTime: TBD,
    ctoHandsOn: TBD,
    agencyRate: TBD,
    wpMaintenance: TBD,
    /** Typical MVP budget range quoted in the home FAQ. */
    mvpRangeMin: TBD,
    mvpRangeMax: TBD,
  },

  playStore: {
    developer: 'https://play.google.com/store/apps/developer?id=VicsoThemes',
    hebrew: 'https://play.google.com/store/apps/details?id=com.vicsothemes.hebrewforbeginners',
    hangul: 'https://play.google.com/store/apps/details?id=com.vicsothemes.hangulhero',
    eestiVerbid: 'https://play.google.com/store/apps/details?id=com.vicsothemes.eesti_verbid',
  },

  formspree: 'https://formspree.io/f/mdabeqkd',
  gscVerification: 'tx8IsE5ya6PCfZBcCKREggMUHuKMPRWN4T-xp9wtq3Q',
  ogImage: '/og-default.png',
} as const;

/** Booking CTA target: the booking tool when set, otherwise the contact page. */
export const bookingHref = isSet(site.bookingUrl) ? site.bookingUrl : '/contact/';

export const legalLine = `${site.companyName} OÜ, ${site.city}`;
