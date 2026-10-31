// Çerezsiz ziyaret sayacı.
// POST /api/ziyaret  { p, source?, medium?, campaign?, content?, term? }  → 204
// GET  /api/ziyaret?gun=7[&k=ANAHTAR]  → günlük toplamlar (sayfa, kaynak, reklam, yayıncı)
// Çerez, cihaz kimliği, IP ya da tarayıcı bilgisi saklanmaz. Her ziyaret için yalnızca sayfa yolu ve utm etiketleri,
// tarih altında tekil bir anahtarla yazılır (eşzamanlı yazmada sayım kaybı olmaz). ZIYARET_ANAHTAR tanımlıysa okuma için ?k= gerekir.
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|axios/i;
const gun = (offset = 0) => new Date(Date.now() + 3 * 3600e3 - offset * 864e5).toISOString().slice(0, 10);
const temiz = (v: unknown, n = 80) => (typeof v === 'string' ? v.replace(/[^\p{L}\p{N}_\-./{}:]/gu, '').slice(0, n) : '');
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default async (req: Request) => {
  const store = getStore('ziyaret');
  if (req.method === 'POST') {
    if (BOT.test(req.headers.get('user-agent') || '')) return new Response(null, { status: 204 });
    let d: any = {};
    try { d = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204 }); }
    const kayit = { p: temiz(d.p, 160) || '/', s: temiz(d.source), m: temiz(d.medium), c: temiz(d.campaign), i: temiz(d.content), t: temiz(d.term) };
    await store.setJSON(`g/${gun()}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, kayit);
    return new Response(null, { status: 204 });
  }
  const url = new URL(req.url);
  const anahtar = process.env.ZIYARET_ANAHTAR;
  if (anahtar && url.searchParams.get('k') !== anahtar) return json({ error: 'yetki' }, 401);
  const n = Math.min(31, Math.max(1, Number(url.searchParams.get('gun')) || 7));
  const say = (o: Record<string, number>, k: string) => { if (k) o[k] = (o[k] || 0) + 1; };
  const sirala = (o: Record<string, number>, max = 50) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, max).map(([k, v]) => ({ k, v }));
  const gunler: any[] = [];
  const top = { sayfa: {} as Record<string, number>, kaynak: {} as Record<string, number>, reklam: {} as Record<string, number>, yayinci: {} as Record<string, number>, reklamSayfa: {} as Record<string, number> };
  let toplam = 0, reklamli = 0;
  for (let i = 0; i < n; i++) {
    const g = gun(i);
    const { blobs } = await store.list({ prefix: `g/${g}/` });
    let gt = 0, gr = 0;
    const kayitlar = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' }).catch(() => null)));
    for (const k of kayitlar as any[]) {
      if (!k) continue;
      gt++; say(top.sayfa, k.p);
      if (k.s) { gr++; say(top.kaynak, `${k.s} / ${k.m || '-'}${k.c ? ' / ' + k.c : ''}`); say(top.reklam, k.i ? `${k.s}:${k.i}` : ''); say(top.yayinci, k.t ? `${k.s}:${k.t}` : ''); say(top.reklamSayfa, `${k.s} → ${k.p}`); }
    }
    toplam += gt; reklamli += gr;
    gunler.push({ gun: g, ziyaret: gt, reklamdanGelen: gr });
  }
  return json({ gun: n, toplamSayfaGoruntuleme: toplam, reklamdanGelen: reklamli, gunler, kaynak: sirala(top.kaynak), reklam: sirala(top.reklam), yayinci: sirala(top.yayinci), reklamSayfa: sirala(top.reklamSayfa), sayfa: sirala(top.sayfa, 30) });
};

export const config: Config = {
  path: '/api/ziyaret',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
