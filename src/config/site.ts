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

  /** Client testimonial on /mvp/ (hidden until every field is set). */
  testimonial: {
    quote: TBD,
    name: TBD,
    role: TBD,
    company: TBD,
  },

  /** "Full guide: how much an MVP costs" link on /mvp/ (hidden until set). */
  mvpCostGuideUrl: TBD,

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

  appStore: {
    hebrew: 'https://apps.apple.com/us/app/learn-hebrew-read-speak/id6813120842',
  },

  hebrewedu: 'https://hebrewedu.com/',

  formspree: 'https://formspree.io/f/mdabeqkd',
  gscVerification: 'tx8IsE5ya6PCfZBcCKREggMUHuKMPRWN4T-xp9wtq3Q',
  ogImage: '/og-default.png',
} as const;

/** Booking CTA target: the booking tool when set, otherwise the contact page. */
export const bookingHref = isSet(site.bookingUrl) ? site.bookingUrl : '/contact/';

export const hasCompany = isSet(site.companyName);

/** Footer legal line; omitted until the company name is known. */
export const legalLine = hasCompany ? `${site.companyName} OÜ, ${site.city}` : null;

/** Contract/invoice copy: Estonian company + VAT once registered, neutral EUR wording until then. */
export const billing = hasCompany
  ? {
      intro: 'Invoices from an Estonian company, EU VAT handled.',
      euTitle: 'EU contracts & GDPR',
      euText: 'Estonian company, EU VAT invoices, data processing agreement on request.',
      compareCell: 'EU company, VAT invoice',
      contact: 'Estonian company, EU VAT invoices, NDA on request.',
    }
  : {
      intro: 'Contracts and invoices in EUR.',
      euTitle: 'EU-based, EU-friendly',
      euText: 'Based in Estonia, contracts and invoices in EUR, data processing agreement on request.',
      compareCell: 'Direct contract, EUR invoice',
      contact: 'Direct contract, invoices in EUR, NDA on request.',
    };
