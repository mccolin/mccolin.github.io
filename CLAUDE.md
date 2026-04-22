# CLAUDE.md — mccolin.com

This is the personal website of Colin McCloskey. It is a static site built with
Astro, hosted on GitHub Pages, and deployed via GitHub Actions.

---

## Project Overview

A minimal personal site with the following pages and features:

- **Splash / Home** (`/`) — personality-forward landing page
- **About** (`/about`) — profile and background
**Resume** (`/resume`) — professional history
- **Blog** (`/blog`) — infrequently updated; index + individual post pages

The site should feel personal, text-forward, and a little quirky — consistent
with the current mccolin.com aesthetic. Avoid generic portfolio/blog templates.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Static site generator | [Astro](https://astro.build) (latest stable) |
| Templating | `.astro` components; MDX for blog posts |
| Styling | Scoped CSS in `.astro` files; global styles in `src/styles/global.css` |
| Blog content | Astro Content Collections (`src/content/blog/`) |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions (`.github/workflows/deploy.yml`) |
| Package manager | npm |

No UI frameworks (React, Vue, Svelte) unless a specific interactive feature
requires one. Keep the JS footprint minimal.

---

## Project Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages
├── public/
│   └── favicon.svg
├── src/
│   ├── content/
│   │   ├── config.ts           # Content Collections schema
│   │   └── blog/               # .md or .mdx blog posts
│   ├── layouts/
│   │   ├── BaseLayout.astro    # HTML shell, <head>, global nav
│   │   └── PostLayout.astro    # Wraps individual blog posts
│   ├── pages/
│   │   ├── index.astro         # Splash / Home
│   │   ├── about.astro         # About / Profile
│   │   ├── resume.astro        # Resume
│   │   └── blog/
│   │       ├── index.astro     # Blog post listing
│   │       └── [...slug].astro # Dynamic blog post pages
│   ├── components/             # Reusable .astro components
│   └── styles/
│       └── global.css          # CSS custom properties, resets, base styles
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Content Collections

Blog posts live in `src/content/blog/` as `.md` or `.mdx` files.

Schema defined in `src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

- Posts with `draft: true` should be excluded from production builds.
- Sort posts by `pubDate` descending on the blog index.

---

## Astro Config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://mccolin.com',
  integrations: [mdx()],
});
```

For GitHub Pages with a custom domain, `site` should be the full URL and no
`base` path is needed (since it's at the root).

---

## GitHub Actions Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

A `CNAME` file containing `mccolin.com` should be placed in `public/` so GitHub
Pages preserves the custom domain on each deploy.

---

## Design Guidelines

- **Tone:** Personal, minimal, slightly quirky. Text is the primary design
  element. Avoid heavy hero images, stock photography, or corporate-feeling
  layouts.
- **Typography:** Prioritize readability. One or two typefaces max. Prefer
  system fonts or a single well-chosen web font loaded via `<link>` in
  `BaseLayout.astro`.
- **Color:** A restrained palette. Dark text on light background (or a
  deliberate inversion). Use CSS custom properties in `global.css` for all
  colors so theming is easy.
- **Navigation:** Simple. Site name/logo links home; nav links to About, Resume,
  Blog. No hamburger menus needed at this scale.
- **Responsiveness:** Mobile-first. The site should read well on a phone without
  special treatment — it's mostly text anyway.

---

## Development Workflow

```bash
npm run dev      # Local dev server at localhost:4321
npm run build    # Production build to dist/
npm run preview  # Preview the production build locally
```

---

## Key Conventions

- Prefer `.astro` components over framework components unless interactivity
  demands otherwise.
- Keep frontmatter in `.astro` files lean — heavy data logic belongs in
  `src/lib/` utilities.
- Do not commit build artifacts (`dist/`). The GitHub Action handles deployment.
- Blog post filenames should be slugs: `2025-04-my-post-title.md`. The slug
  becomes the URL path.
- Images for blog posts can live in `src/content/blog/` alongside the post file
  and referenced with relative paths (Astro handles optimization).
- Keep `draft: true` in any post that isn't ready to publish.
