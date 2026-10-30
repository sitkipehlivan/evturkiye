import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Ana domain Netlify'daki SITE_URL ortam değişkeninden gelir (yoksa yayındaki evturkiye.online).
// .com.tr TRABİS onayından sonra aktif olunca Netlify'da SITE_URL=https://evturkiye.com.tr yap (bkz. docs/seo.md).
const site = process.env.SITE_URL || 'https://evturkiye.online';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (p) => !['/admin', '/offline', '/hesabim'].some((x) => p.includes(x)) })],
});
