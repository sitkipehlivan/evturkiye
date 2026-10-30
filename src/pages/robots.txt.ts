import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${new URL('/sitemap-index.xml', site)}\nSitemap: ${new URL('/news-sitemap.xml', site)}\n# Yapay zekâ arama motorları için özet: ${new URL('/llms.txt', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
