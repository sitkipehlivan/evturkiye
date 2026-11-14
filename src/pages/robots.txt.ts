import type { APIRoute } from 'astro';

// Arama motorları ve yapay zekâ arama botları (ChatGPT, Perplexity, Claude, Gemini, Copilot, Apple) açıkça izinli.
// Bu botların grubu "*" kuralını devralmadığı için /admin kapatması her grupta tekrar edilir.
const BOTLAR = [
  'Googlebot', 'Googlebot-News', 'Googlebot-Image', 'Google-Extended', 'Bingbot', 'YandexBot', 'Applebot', 'Applebot-Extended',
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'DuckAssistBot', 'MistralAI-User', 'meta-externalagent',
];
export const GET: APIRoute = ({ site }) => {
  const s = (p: string) => new URL(p, site).toString();
  const body = [
    ...BOTLAR.map((b) => `User-agent: ${b}`),
    'Allow: /',
    'Disallow: /admin/',
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    '',
    `Sitemap: ${s('/sitemap-index.xml')}`,
    `Sitemap: ${s('/news-sitemap.xml')}`,
    `# Yapay zekâ arama motorları için özet: ${s('/llms.txt')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
