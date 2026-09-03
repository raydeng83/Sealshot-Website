import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),

  /**
   * Guides — the SEO surface at /guides/.
   *
   * A collection rather than a page per file so that adding the next guide is
   * one markdown file and nothing else: the landing grid, the route, the
   * sitemap entry and the meta tags all come from the frontmatter below. The
   * file name is the URL slug (search-screenshots-mac.md → /guides/search-screenshots-mac/).
   *
   * Deliberately NOT part of the Starlight `docs` collection: these are
   * standalone marketing pages that wear the site header and footer, not the
   * docs sidebar.
   */
  guides: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
    schema: z.object({
      /** The <h1> and the card title. */
      title: z.string(),
      /** <meta name="description"> and og:description. One sentence, ~155 chars. */
      description: z.string(),
      /** Card blurb on /guides/. Shorter and blunter than the description. */
      summary: z.string(),
      /** Sort order in the grid. Lower first; ties fall back to title. */
      order: z.number().default(100),
      /** Written but not ready: kept out of the grid and out of the build. */
      draft: z.boolean().default(false),
    }),
  }),
};
