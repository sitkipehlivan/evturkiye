import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://evturkiye.com.tr',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (p) => !p.includes('/admin') })],
});
