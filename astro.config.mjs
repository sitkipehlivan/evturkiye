import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Ana domain Netlify'daki SITE_URL ortam değişkeninden gelir (yoksa .com.tr).
// .com.tr onaylanınca SITE_URL'yi değiştirmek yeterli.
const site = process.env.SITE_URL || 'https://evturkiye.com.tr';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (p) => !p.includes('/admin') && !p.includes('/offline') })],
});
