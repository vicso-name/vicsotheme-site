import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { redirects } from './src/config/redirects.mjs';

const site = 'https://vicsotheme.com';
const redirectSources = new Set(Object.keys(redirects).map((p) => `${site}${p}/`));

export default defineConfig({
  site,
  redirects,
  integrations: [
    sitemap({
      filter: (page) => !redirectSources.has(page) && !/\/404\/?$/.test(page),
    }),
  ],
});
