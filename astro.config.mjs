// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://mccolin.com',
  integrations: [mdx()],
  env: {
    schema: {
      SHOW_NOTES: envField.boolean({ context: "server", access: "public", default: false }),
      // API_URL: envField.string({ context: "client", access: "public", optional: true }),
      // PORT: envField.number({ context: "server", access: "public", default: 4321 }),
      // API_SECRET: envField.string({ context: "server", access: "secret", optional: true }),
    }
  }
})