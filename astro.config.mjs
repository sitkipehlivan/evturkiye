import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';

// Dizine alınmayan (noindex) sayfalar site haritasına da girmez. Kurallar src/lib/indeks.ts ve sayfa şablonlarıyla aynı.
const kapali = new Set();
{
  const models = JSON.parse(fs.readFileSync('src/data/models.json', 'utf8')).models;
  const grup = new Map(), marka = new Map();
  for (const m of models) {
    const k = `/modeller/${m.brandSlug}/${m.modelSlug}`;
    grup.set(k, (grup.get(k) || false) || !m.discontinued);
    marka.set(`/modeller/${m.brandSlug}`, (marka.get(`/modeller/${m.brandSlug}`) || false) || !m.discontinued);
  }
  for (const [k, satista] of [...grup, ...marka]) if (!satista) kapali.add(k);
  const say = (md) => md.replace(/<[^>]+>/g, ' ').replace(/[#*_>|`\[\]()-]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
  for (const f of fs.readdirSync('src/content/haberler')) {
    if (!f.endsWith('.md')) continue;
    const s = fs.readFileSync(`src/content/haberler/${f}`, 'utf8');
    const govde = s.replace(/^---[\s\S]*?\n---\n/, '');
    const kat = (s.match(/^category:\s*(\S+)/m) || [])[1];
    if (kat && say(govde) < 200) kapali.add(`/haberler/${kat}/${f.slice(0, -3)}`);
  }
}
// Site haritası lastmod: Google ve IndexNow hangi sayfanın yenilendiğini buradan anlar. Yalnızca gerçek tarihi bilinen sayfalar.
const sonDegisim = new Map();
{
  const tarih = (s, k) => (s.match(new RegExp(`^${k}:\\s*["']?(\\d{4}-\\d{2}-\\d{2}[^"'\\s]*)`, 'm')) || [])[1];
  let enYeni = '';
  for (const f of fs.readdirSync('src/content/haberler')) {
    if (!f.endsWith('.md')) continue;
    const s = fs.readFileSync(`src/content/haberler/${f}`, 'utf8');
    const kat = (s.match(/^category:\s*(\S+)/m) || [])[1];
    const t = tarih(s, 'updated') || tarih(s, 'date');
    if (!kat || !t) continue;
    sonDegisim.set(`/haberler/${kat}/${f.slice(0, -3)}`, t);
    if (t > enYeni) enYeni = t;
    const k = `/haberler/${kat}`; if (!sonDegisim.has(k) || sonDegisim.get(k) < t) sonDegisim.set(k, t);
  }
  for (const f of fs.readdirSync('src/content/firsatlar')) {
    if (!f.endsWith('.md')) continue;
    const t = tarih(fs.readFileSync(`src/content/firsatlar/${f}`, 'utf8'), 'date');
    if (t && (!sonDegisim.has('/firsatlar') || sonDegisim.get('/firsatlar') < t)) sonDegisim.set('/firsatlar', t);
  }
  if (enYeni) { sonDegisim.set('', enYeni); sonDegisim.set('/haberler', enYeni); }
  const opsT = JSON.parse(fs.readFileSync('src/data/operators.json', 'utf8')).updated;
  if (opsT) sonDegisim.set('/sarj-fiyatlari', opsT);
}
const lastmodOf = (p) => {
  const k = p.replace(/\/$/, '');
  if (sonDegisim.has(k)) return sonDegisim.get(k);
  if (k.startsWith('/sarj-fiyatlari/')) return sonDegisim.get('/sarj-fiyatlari');
};

const disarida = (p) => kapali.has(p) || p.startsWith('/sarj-istasyonlari/');

// Ana domain Netlify'daki SITE_URL ortam değişkeninden gelir (yoksa yayındaki evturkiye.online).
// .com.tr TRABİS onayından sonra aktif olunca Netlify'da SITE_URL=https://evturkiye.com.tr yap (bkz. docs/seo.md).
const site = process.env.SITE_URL || 'https://evturkiye.online';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (p) => !disarida(new URL(p).pathname.replace(/\/$/, '')) && !['/admin', '/offline', '/hesabim', '/reklam-rapor', '/ara', '/hesap-silme'].some((x) => new URL(p).pathname.replace(/\/$/, '') === x || new URL(p).pathname.startsWith(x + '/')),
    serialize: (item) => {
      const t = lastmodOf(new URL(item.url).pathname);
      if (t) item.lastmod = new Date(t).toISOString();
      return item;
    },
  })],
});
