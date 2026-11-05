// Doğrudan reklam sayacı (Ad Manager açılana kadar geçiş çözümü).
// POST /api/reklam            { e: 'g'|'k', k: kampanya, s: '800x600' }  → 204   (g: gösterim, k: kapatma)
// GET  /api/reklam/c/<kampanya>/<boyut>?u=<hedef>                        → 302   (click: sayar ve reklamverenin click izleyicisine yönlendirir)
//      Yol tabanlı: Adform ';click=' makrosuna eklenen adreste '&' olmasın diye kampanya ve boyut yolda taşınır.
// GET  /api/reklam?rapor=1&gun=30&a=ANAHTAR                              → kampanya / gün / boyut kırılımında gösterim, click, kapatma
// Çerez, cihaz kimliği, IP saklanmaz; her olay yalnızca kampanya, boyut ve sayfa yolu olarak tarih altında tekil anahtarla yazılır.
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|axios/i;
const gun = (offset = 0) => new Date(Date.now() + 3 * 3600e3 - offset * 864e5).toISOString().slice(0, 10);
const temiz = (v: unknown, n = 60) => (typeof v === 'string' ? v.replace(/[^a-z0-9x_\-./]/gi, '').slice(0, n) : '');
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const yaz = (store: ReturnType<typeof getStore>, e: string, k: string, s: string, p = '') =>
  store.setJSON(`o/${gun()}/${k}/${e}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, { s, p });

// Click yalnızca bilinen reklam sunucularına yönlendirilir (açık yönlendirme olmasın)
const IZINLI = /(^|\.)(adform\.net|adform\.com|doubleclick\.net|googleadservices\.com|g\.doubleclick\.net)$/i;

export default async (req: Request) => {
  const store = getStore('reklam');
  const url = new URL(req.url);
  const ua = req.headers.get('user-agent') || '';

  if (req.method === 'POST') {
    if (BOT.test(ua)) return new Response(null, { status: 204 });
    let d: any = {};
    try { d = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204 }); }
    const e = d.e === 'g' || d.e === 'k' ? d.e : '';
    const k = temiz(d.k), s = temiz(d.s, 12);
    if (e && k) await yaz(store, e, k, s, temiz(d.p, 160));
    return new Response(null, { status: 204 });
  }

  const yol = url.pathname.split('/').filter(Boolean); // ['api','reklam','c',k,s]
  if (yol[2] === 'c') {
    // Adform hedef adresi u= parametresinden sonra kodlanmış ya da kodlanmamış gelebilir; ham sorgudan alınır
    const ham = url.search.split(/[?&]u=/)[1] || '';
    let hedef = ham;
    try { if (/^https?%3A/i.test(ham)) hedef = decodeURIComponent(ham); } catch {}
    let ok = false;
    try { const h = new URL(hedef); ok = h.protocol === 'https:' && IZINLI.test(h.hostname); } catch {}
    const k = temiz(yol[3]), s = temiz(yol[4], 12);
    if (ok && k && !BOT.test(ua)) await yaz(store, 'c', k, s);
    return new Response(null, { status: 302, headers: { location: ok ? hedef : '/', 'cache-control': 'no-store' } });
  }

  if (url.searchParams.has('rapor')) {
    const anahtar = process.env.REKLAM_ANAHTAR;
    if (!anahtar || url.searchParams.get('a') !== anahtar) return json({ error: 'yetki' }, 401);
    const n = Math.min(90, Math.max(1, Number(url.searchParams.get('gun')) || 30));
    const out: Record<string, { gunler: any[]; boyut: Record<string, { g: number; c: number; k: number }>; toplam: { g: number; c: number; k: number } }> = {};
    for (let i = 0; i < n; i++) {
      const g = gun(i);
      const { blobs } = await store.list({ prefix: `o/${g}/` });
      const say: Record<string, { g: number; c: number; k: number }> = {};
      const kayitlar = await Promise.all(blobs.map(async (b) => ({ key: b.key, v: (await store.get(b.key, { type: 'json' }).catch(() => null)) as any })));
      for (const { key, v } of kayitlar) {
        const [, , k, e] = key.split('/');
        if (!k || !['g', 'c', 'k'].includes(e)) continue;
        out[k] ??= { gunler: [], boyut: {}, toplam: { g: 0, c: 0, k: 0 } };
        say[k] ??= { g: 0, c: 0, k: 0 };
        say[k][e as 'g']++; out[k].toplam[e as 'g']++;
        const s = v?.s || '-';
        out[k].boyut[s] ??= { g: 0, c: 0, k: 0 };
        out[k].boyut[s][e as 'g']++;
      }
      for (const k of Object.keys(say)) out[k].gunler.push({ gun: g, ...say[k] });
    }
    return json({ gun: n, olusturma: new Date().toISOString(), kampanyalar: out });
  }

  return json({ error: 'gecersiz' }, 400);
};

export const config: Config = {
  path: ['/api/reklam', '/api/reklam/c/*'],
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
