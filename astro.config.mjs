import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://seal-shot.com',
  integrations: [
    starlight({
      title: 'Sealshot Docs',
    }),
  ],
});
