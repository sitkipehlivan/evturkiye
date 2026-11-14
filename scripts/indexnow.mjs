// IndexNow: değişen sayfaları Bing, Yandex, Seznam, Naver'a anında bildirir (Bing dizini ChatGPT/Copilot aramasını da besler).
// Kullanım: node scripts/indexnow.mjs [--gun 2] [--hepsi]
// Canlı site haritasını okur, lastmod'u son N gün içinde olan sayfaları gönderir. Anahtar dosyası: public/<KEY>.txt
const KEY = '085a16e8f755fad7b53815d9ed9e95b1';
const SITE = process.env.SITE_URL || 'https://evturkiye.online';
const args = process.argv.slice(2);
const hepsi = args.includes('--hepsi');
const gun = Number(args[args.indexOf('--gun') + 1]) || 2;
const sinir = Date.now() - gun * 864e5;

const xml = async (u) => (await fetch(u, { headers: { 'User-Agent': 'evturkiye-indexnow' } })).text();
const urls = new Set();
const idx = await xml(`${SITE}/sitemap-index.xml`);
for (const sm of [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])) {
  const s = await xml(sm);
  for (const m of s.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lm = (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc && (hepsi || (lm && Date.parse(lm) >= sinir))) urls.add(loc);
  }
}
const news = await xml(`${SITE}/news-sitemap.xml`).catch(() => '');
for (const m of news.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
if (!hepsi) { urls.add(`${SITE}/`); urls.add(`${SITE}/haberler/`); }

const list = [...urls];
console.log(`${list.length} adres gönderiliyor`);
const host = new URL(SITE).host;
for (let i = 0; i < list.length; i += 10000) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: list.slice(i, i + 10000) }),
  });
  console.log('IndexNow yanıtı:', r.status, await r.text());
  if (r.status >= 400 && r.status !== 429) process.exitCode = 1;
}
