/**
 * Legacy URL → new URL. Shared by astro.config.mjs (meta-refresh stubs),
 * the sitemap filter and scripts/check-seo.mjs.
 */
export const redirects = {
  // Old blog (removed earlier)
  '/blog': '/',
  '/blog/astro-vs-wordpress-2026': '/services/cms-content-architecture/',
  '/blog/how-to-publish-google-play': '/services/mobile-product-engineering/',
  '/blog/why-flutter-gets-hate': '/services/mobile-product-engineering/',
  '/blog/why-i-build-language-apps': '/services/edtech-learning-systems/',

  // v1 service pages → v2
  '/services/mobile-product-engineering': '/mvp/',
  '/services/ai-product-engineering': '/mvp/',
  '/services/saas-platform-engineering': '/mvp/',
  '/services/technical-strategy-optimization': '/technical-partner/',
  '/services/edtech-learning-systems': '/cases/hebrew-app/',
  '/services/cms-content-architecture': '/services/',
  '/apps': '/cases/',
};
