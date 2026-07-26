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
            { slug: 'docs/workflows', label: 'Overview' },
            { slug: 'docs/workflows/explain', label: 'Explain' },
            { slug: 'docs/workflows/publish', label: 'Publish' },
            { slug: 'docs/workflows/demonstrate', label: 'Demonstrate' },
            { slug: 'docs/workflows/protect-and-share', label: 'Protect & share' },
            { slug: 'docs/workflows/extract', label: 'Extract' },
            { slug: 'docs/workflows/recipes', label: 'Examples' },
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
