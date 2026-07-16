import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://seal-shot.com',
  integrations: [
    starlight({
      title: 'Sealshot Docs',
      logo: { src: './src/assets/icon.png', alt: 'Sealshot' },
      favicon: '/favicon.png',
      customCss: ['./src/styles/starlight.css'],
      sidebar: [
        {
          label: 'Guide',
          items: [
            { slug: 'docs/guide/getting-started' },
            { slug: 'docs/guide/capture' },
            { slug: 'docs/guide/recording' },
            { slug: 'docs/guide/editor' },
            { slug: 'docs/guide/redaction' },
            { slug: 'docs/guide/ai' },
            { slug: 'docs/guide/library' },
            { slug: 'docs/guide/sharing' },
            { slug: 'docs/guide/security' },
            { slug: 'docs/guide/settings' },
            { slug: 'docs/guide/shortcuts' },
            { slug: 'docs/guide/seal-format' },
          ],
        },
        { label: 'FAQ', slug: 'docs/faq' },
        {
          label: 'Changelog',
          collapsed: true,
          autogenerate: { directory: 'docs/changelog' },
        },
        { label: 'Support & feedback', link: '/support/' },
        { label: 'seal-shot.com', link: '/' },
      ],
    }),
  ],
});
