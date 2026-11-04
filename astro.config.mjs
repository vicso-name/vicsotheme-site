import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { redirects } from './src/config/redirects.mjs';

const site = 'https://vicsotheme.com';
const redirectSources = new Set(Object.keys(redirects).map((p) => `${site}${p}/`));

export default defineConfig({
  site,
  redirects,
  // Inline page scripts up to 8 KB (the calculator script is ~5 KB) instead of a separate request.
  vite: { build: { assetsInlineLimit: 8192 } },
  integrations: [
    sitemap({
      filter: (page) => !redirectSources.has(page) && !/\/404\/?$/.test(page),
    }),
  ],
});
