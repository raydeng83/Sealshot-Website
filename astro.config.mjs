import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://seal-shot.com',
  integrations: [
    starlight({
      title: 'Sealshot',
      logo: { src: './src/assets/icon.png', alt: 'Sealshot' },
      favicon: '/favicon.png',
      customCss: ['./src/styles/starlight.css'],
      // Docs are light-only for now; both overrides together remove the
      // theme picker and pin data-theme. Delete both lines to restore
      // light/dark switching.
      components: {
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        // Header brand: icon + "Sealshot" → main site, "Documentation" → /docs/.
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        // Starlight draws <Banner /> on every page and its default renders
        // nothing without `banner:` frontmatter — so this is where the docs pick
        // up the sitewide founding-price bar.
        Banner: './src/components/starlight/Banner.astro',
      },
      sidebar: [
        { slug: 'docs', label: 'Overview' },
        {
          label: 'Quickstart',
          items: [
            { slug: 'docs/quickstart/install', label: 'Install & permissions' },
            { slug: 'docs/quickstart/parts', label: 'The parts of Sealshot' },
            { slug: 'docs/quickstart/first-capture', label: 'Your first capture' },
          ],
        },
        {
          label: 'Guide',
          items: [
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
        {
          label: 'Tips & tricks',
          items: [
            { slug: 'docs/tips', label: 'Overview' },
            { slug: 'docs/tips/capture', label: 'Capture' },
            { slug: 'docs/tips/encrypt', label: 'Encrypt' },
            { slug: 'docs/tips/refine', label: 'Refine' },
            { slug: 'docs/tips/organize', label: 'Organize' },
            { slug: 'docs/tips/deliver', label: 'Deliver' },
          ],
        },
        { label: 'FAQ', slug: 'docs/faq' },
        {
          label: 'Changelog',
          collapsed: true,
          autogenerate: { directory: 'docs/changelog' },
        },
        { label: 'Support & feedback', link: '/support/' },
      ],
    }),
  ],
});
