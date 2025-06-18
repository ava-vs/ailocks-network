import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),
    tailwind(),
    netlify({
      edgeMiddleware: true
    })
  ],
  output: 'server',
  adapter: netlify(),
  // Remove i18n config since we're handling language switching client-side
  // This prevents Astro from creating /ru routes that don't exist
});