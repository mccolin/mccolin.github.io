# mccolin.com

Personal site of Colin McCloskey. Minimal, text-forward, occasionally updated.

Built with [Astro](https://astro.build), hosted on [GitHub Pages](https://pages.github.com), deployed automatically on push to `main`.

---



## Local development

Requires Node `>=22.12.0` (see `engines` in `package.json`).

```sh
npm install
npm run dev      # dev server at localhost:4321
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```



## Content collections

Schemas live in `src/content.config.ts`.

### Notes

The **Notes** site section functions like a Blog. 

Content is stored within `src/content/notes/*.mdx|md` and rendered by the
`/pages/notes` views.

Filename becomes the URL slug, e.g. `2025-05-something-i-noticed.mdx` → `/notes/2025-05-something-i-noticed/`.

The Notes section is hidden from navigation unless the `SHOW_NOTES` env var
(defined via `astro:env` in `astro.config.mjs`) is set to `true`. It's still
reachable directly at `/notes` either way — visit `/test` for a quick link
and a build/render status check.

Individual posts can be hidden by setting `draft: true` in their metadata.
Draft posts are listed in the notes index in dev, but not production.

Example note header metadata:

```yaml
---
title: "Something I noticed"
description: "Optional — used for the post listing and og:description."
pubDate: 2025-05-12
draft: true          # Remove or set false to publish
tags: ["optional"]
image: ../../assets/notes/some-image.jpg   # Optional — used for the post thumbnail and og:image
---
```



### About

A historical set of **About** pages are kept under `src/content/about/*.md`.

One file per yearly edition, named by year (e.g. `2026.md` → `/about/2026/`). Schema is just:

```yaml
---
year: 2026
title: "About Colin, 2026"
---
```

The most recent about page is rendered by `about.astro` at `/about`; older
ones stay reachable at `/about/<year>`.



## Site metadata & Open Graph

`BaseLayout.astro` generates `og:title`, `og:description`, `og:image`, and
`og:url` for every page automatically, built from each page's `title`/
`description` props and the deployed site root (`site` in
`astro.config.mjs`). An explicit `image` prop (a resolved image src string)
overrides the default; otherwise it falls back to
`src/assets/profile/colin_emoji.png`. The homepage instead uses a fixed,
appropriately-sized thumbnail of one background photo — see
`getOgImage()` in `src/lib/bgphotos.ts` (the specific photo is a one-line
constant there, easy to swap). Individual notes use their `image`
frontmatter field when present.


## Link previews

`src/components/LinkPreview.astro` renders an Open Graph-style card for a
link to an external site (title, description, image, site name). The OG data
is fetched at **build time**, not in the browser — the site has no server
runtime, and a browser-side fetch of arbitrary external pages would hit CORS
almost everywhere.

Usage in an `.mdx` note:

```mdx
import LinkPreview from '../../components/LinkPreview.astro';

<LinkPreview
  href="https://example.com/some-article"
  caption="Optional caption, rendered the same way as Figure's."
/>
```

`title`/`description` props can override the fetched values if a site's OG
data is missing or wrong.

### Maintaining `src/data/link-previews.json`

Fetched OG data is cached here, keyed by URL, and **committed to the repo**
so builds don't refetch every link on every push.

- On first use of a `href`, `src/lib/linkPreview.ts` fetches the page,
  parses its OG/meta tags, and writes the result into this file.
- Subsequent builds reuse the cached entry — no network call, no automatic
  expiry. **To force a refresh** (the target page's title/image changed),
  delete that URL's entry from the file and rebuild.
- If a fetch fails, times out, or a site has no OG tags, the cache stores a
  degraded-but-valid fallback (hostname-only title, no image) instead of
  failing the build.
- **Stale entries are pruned automatically.** Every build scans all
  `.astro`/`.md`/`.mdx` files under `src/` for `<LinkPreview href="...">`
  usages and drops any cached URL no longer referenced anywhere in the site
  content.
- **Recommended workflow:** add or edit a `LinkPreview` locally, run
  `npm run dev` (or `npm run build`) once to populate the cache, then commit
  the updated `link-previews.json` alongside the content change. Skipping
  this just means GitHub Actions does the live fetch during the deploy
  build instead — slower, and dependent on the target site being reachable
  from GitHub's runners at that moment, but not a failure mode.


## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
`.github/workflows/deploy.yml` (Node 22, `npm ci && npm run build`), which
deploys the build to GitHub Pages. The `public/CNAME` file preserves the
`mccolin.com` custom domain across deploys.



## Project structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions → GitHub Pages
├── public/
│   ├── CNAME                     # Custom domain: mccolin.com
│   ├── things/                   # Static images referenced by /things
│   └── favicon*, site.webmanifest
├── src/
│   ├── assets/
│   │   ├── bgphotos/              # Homepage random-background photos
│   │   ├── bghidden/              # Backgrounds reachable only via ?bg=, browsable at /test
│   │   ├── notes/                 # Images referenced by note content
│   │   └── profile/               # colin_emoji.png (site avatar + OG fallback image) and other portraits
│   ├── content/
│   │   ├── notes/                 # Notes (blog posts) as .mdx files
│   │   └── about/                 # Yearly About page editions as .md files
│   ├── content.config.ts          # Content Collections schemas (notes, about)
│   ├── data/
│   │   └── link-previews.json     # Committed cache for LinkPreview — see below
│   ├── layouts/
│   │   ├── BaseLayout.astro       # HTML shell, nav, global styles, Open Graph tags
│   │   └── PostLayout.astro       # Wraps individual note pages
│   ├── lib/
│   │   ├── bgphotos.ts            # Background-photo maps + homepage OG thumbnail
│   │   ├── greetings.ts           # Homepage greeting/emoji text
│   │   └── linkPreview.ts         # Build-time OG fetch/cache/prune for LinkPreview
│   ├── components/
│   │   ├── Figure.astro           # Inline/siderail image with caption
│   │   ├── LinkPreview.astro      # External-link OG preview card
│   │   └── SocialLinks.astro      # Social icon links
│   ├── pages/
│   │   ├── index.astro            # Home
│   │   ├── about.astro            # About (latest edition)
│   │   ├── about/[year].astro     # About, previous yearly editions
│   │   ├── resume.astro           # Resume
│   │   ├── things.astro           # Curated list of links/projects
│   │   ├── test.astro             # Scratch/debug page (backgrounds, greetings, LinkPreview checks)
│   │   └── notes/
│   │       ├── index.astro        # Note listing
│   │       └── [...slug].astro    # Individual note pages
│   └── styles/
│       └── global.css             # CSS custom properties and base styles
├── astro.config.mjs
├── package.json
└── tsconfig.json
```


Copyright 2026, Colin McCloskey
