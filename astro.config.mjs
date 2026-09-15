import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vicsotheme.com',
  redirects: {
    '/blog': '/',
    '/blog/astro-vs-wordpress-2026': '/services/cms-content-architecture/',
    '/blog/how-to-publish-google-play': '/services/mobile-product-engineering/',
    '/blog/why-flutter-gets-hate': '/services/mobile-product-engineering/',
    '/blog/why-i-build-language-apps': '/services/edtech-learning-systems/',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },
});
