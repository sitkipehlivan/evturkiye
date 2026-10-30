import type { APIRoute } from 'astro';
import { getNews } from '../lib/util';

// Google News site haritası: son 2 günün haberleri (Google yalnızca 48 saatlik içeriği kullanır).
// Rehber yazıları haber değil, normal sitemap'te kalır. Liste boşsa en son 10 haber eklenir ki dosya geçerli kalsın.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const news = (await getNews()).filter((p) => p.data.category !== 'rehber');
  const cutoff = Date.now() - 2 * 864e5;
  let items = news.filter((p) => p.data.date.getTime() >= cutoff);
  if (!items.length) items = news.slice(0, 10);
  const urls = items.slice(0, 1000).map((p) => {
    const loc = new URL(`/haberler/${p.data.category}/${p.id}/`, site).toString();
    return `  <url>
    <loc>${esc(loc)}</loc>
    <news:news>
      <news:publication><news:name>EV Türkiye</news:name><news:language>tr</news:language></news:publication>
      <news:publication_date>${p.data.date.toISOString()}</news:publication_date>
      <news:title>${esc(p.data.title)}</news:title>
    </news:news>
  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
