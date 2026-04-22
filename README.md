# mccolin.com

Personal site of Colin McCloskey. Minimal, text-forward, occasionally updated.

Built with [Astro](https://astro.build), hosted on [GitHub Pages](https://pages.github.com), deployed automatically on push to `main`.

---

## Project structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages
├── public/
│   ├── CNAME                   # Custom domain: mccolin.com
│   └── favicon.svg
├── src/
│   ├── content/
│   │   └── blog/               # Blog posts as .md or .mdx files
│   ├── content.config.ts       # Content Collections schema
│   ├── layouts/
│   │   ├── BaseLayout.astro    # HTML shell, nav, global styles
│   │   └── PostLayout.astro    # Wrapper for individual blog posts
│   ├── pages/
│   │   ├── index.astro         # Home
│   │   ├── about.astro         # About
│   │   ├── resume.astro        # Resume
│   │   └── blog/
│   │       ├── index.astro     # Post listing
│   │       └── [...slug].astro # Individual post pages
│   ├── components/             # Reusable .astro components
│   └── styles/
│       └── global.css          # CSS custom properties and base styles
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Local development

```sh
npm install
npm run dev      # dev server at localhost:4321
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

## Writing a blog post

Add a `.md` or `.mdx` file to `src/content/blog/`. Use a slug as the filename — it becomes the URL path:

```
src/content/blog/2025-05-something-i-noticed.md
```

Required frontmatter:

```yaml
---
title: "Something I noticed"
description: "Optional but useful for SEO and the post listing."
pubDate: 2025-05-12
draft: true          # Remove or set false to publish
tags: ["optional"]
---
```

Posts with `draft: true` are visible in local dev but excluded from production builds.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub Pages. The `public/CNAME` file preserves the `mccolin.com` custom domain across deploys.
