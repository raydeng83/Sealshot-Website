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
        {
          label: 'Workflows',
          items: [
            { slug: 'docs/workflows/bug-reports', label: 'Report bugs safely' },
            { slug: 'docs/workflows/sensitive-documents', label: 'Share sensitive documents' },
            { slug: 'docs/workflows/walkthrough-videos', label: 'Record a walkthrough' },
            { slug: 'docs/workflows/receipts-to-data', label: 'Receipts into data' },
            { slug: 'docs/workflows/documentation', label: 'Write documentation' },
            { slug: 'docs/workflows/knowledge-library', label: 'A library that remembers' },
          ],
        },
        { label: 'Tips & tricks', slug: 'docs/tips' },
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
