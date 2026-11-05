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
  city: 'Pärnu',
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
    mvpPrototype: '€1,500',
    mvpMobile: '€5,700',
    mvpAi: '€7,500',
    ctoAdvisor: '€750',
    ctoPartTime: '€1,500',
    ctoHandsOn: '€2,900',
    agencyRate: '€30',
    wpMaintenance: '€120',
    /** Typical MVP budget range quoted in the home FAQ. */
    mvpRangeMin: '€5,500',
    mvpRangeMax: '€12,000',
  },

  /** App cost calculator pricing (EUR, weeks). Same per-feature prices as client quotes. */
  estimator: {
    base: { label: 'Core app', desc: 'One platform, up to ~12 screens, backend, store release', price: 4400, weeks: 4 },
    /** High end of the range = total × this, rounded to €100. */
    highMultiplier: 1.25,
    /** Timeline range = weeks … weeks + this. */
    extraWeeks: 2,
    features: [
      { id: 'both', label: 'iOS + Android (Flutter)', price: 1300, weeks: 1 },
      { id: 'auth', label: 'Accounts & login', price: 500, weeks: 0.5 },
      { id: 'pay', label: 'Subscriptions or payments', price: 700, weeks: 1 },
      { id: 'ai', label: 'AI feature (LLM)', price: 1800, weeks: 1.5 },
      { id: 'admin', label: 'Admin panel & content', price: 900, weeks: 1 },
      { id: 'push', label: 'Push notifications & streaks', price: 300, weeks: 0.5 },
      { id: 'offline', label: 'Offline mode', price: 500, weeks: 0.5 },
      { id: 'design', label: 'UI design from scratch', price: 900, weeks: 1 },
    ],
  },

  playStore: {
    developer: 'https://play.google.com/store/apps/developer?id=VicsoThemes',
    hebrew: 'https://play.google.com/store/apps/details?id=com.vicsothemes.hebrewforbeginners',
    hangul: 'https://play.google.com/store/apps/details?id=com.vicsothemes.hangulhero',
    eestiVerbid: 'https://play.google.com/store/apps/details?id=com.vicsothemes.eesti_verbid',
    pokerpath: 'https://play.google.com/store/apps/details?id=com.vicsothemes.pokerpath',
  },

  appStore: {
    hebrew: 'https://apps.apple.com/us/app/learn-hebrew-read-speak/id6813120842',
  },

  hebrewedu: 'https://hebrewedu.com/',
  hanguledu: 'https://hanguledu.com/',

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
