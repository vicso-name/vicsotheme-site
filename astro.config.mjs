import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vicsotheme.com',
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
