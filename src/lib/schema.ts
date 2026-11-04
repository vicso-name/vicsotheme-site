/** JSON-LD builders. Values come from site config; unset ([TBD]) fields are left out. */
import { site, isSet, hasCompany, TBD } from '../config/site';

type Json = Record<string, unknown>;

const abs = (path: string) => new URL(path, site.url).toString();
export const personId = abs('/#person');
export const businessId = abs('/#business');

const address = {
  '@type': 'PostalAddress',
  addressLocality: site.city,
  addressCountry: site.countryCode,
};

const sameAs = [site.playStore.developer, site.social.linkedin, site.social.github].filter(isSet);

export function person(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: site.name,
    url: abs('/'),
    jobTitle: site.jobTitle,
    description: `Independent mobile app and product engineer in ${site.city}, ${site.country}: Android, iOS, Flutter and WordPress.`,
    email: `mailto:${site.email}`,
    address,
    knowsAbout: ['Kotlin', 'Jetpack Compose', 'Swift', 'SwiftUI', 'Flutter', 'WordPress', 'Astro', 'RevenueCat', 'Firebase', 'MVP development'],
    sameAs,
  };
}

export function professionalService(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': businessId,
    name: hasCompany ? `${site.companyName} OÜ` : site.name,
    url: abs('/'),
    image: abs(site.ogImage),
    email: site.email,
    address,
    areaServed: { '@type': 'Place', name: 'European Union' },
    founder: { '@id': personId },
    ...(isSet(site.prices.mvpRangeMin) && isSet(site.prices.mvpRangeMax)
      ? { priceRange: `${site.prices.mvpRangeMin}–${site.prices.mvpRangeMax}` }
      : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: [
        { name: 'MVP development', url: abs('/mvp/') },
        { name: 'Fractional CTO', url: abs('/technical-partner/') },
        { name: 'White-label development for agencies', url: abs('/#agencies') },
        { name: 'WordPress development and maintenance', url: abs('/services/') },
      ].map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', ...s } })),
    },
  };
}

export function service(opts: {
  name: string;
  serviceType: string;
  description: string;
  path: string;
  offers: { name: string; description: string }[];
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url: abs(opts.path),
    provider: { '@id': personId, '@type': 'Person', name: site.name },
    areaServed: { '@type': 'Place', name: 'European Union' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: opts.name,
      itemListElement: opts.offers.map((o) => ({
        '@type': 'Offer',
        name: o.name,
        description: o.description,
        url: abs(opts.path),
      })),
    },
  };
}

/** Questions whose answer still has a [TBD] placeholder stay on the page but out of the markup. */
export function faqPage(items: { q: string; a: string }[]): Json {
  items = items.filter((f) => !f.a.includes(TBD));
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export { abs };
