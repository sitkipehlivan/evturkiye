// Görseli olmayan haberler için otomatik EV Türkiye kapak görseli üretir.
// Çıktı: public/images/otomatik/<slug>.png (1600x900). Gerçek görsel eklenince bu kapak kullanılmaz.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const NEWS = 'src/content/haberler';
const OUT = 'public/images/otomatik';
const F = 'scripts/fonts';
fs.mkdirSync(OUT, { recursive: true });

const font = (file, weight, name) => ({ name, weight, style: 'normal', data: fs.readFileSync(path.join(F, file)) });
const fonts = [
  font('plus-jakarta-sans-latin-800-normal.woff', 800, 'Jakarta'),
  font('plus-jakarta-sans-latin-ext-800-normal.woff', 800, 'JakartaExt'),
  font('plus-jakarta-sans-latin-500-normal.woff', 500, 'Jakarta'),
  font('plus-jakarta-sans-latin-ext-500-normal.woff', 500, 'JakartaExt'),
  font('inter-latin-600-normal.woff', 600, 'Inter'),
  font('inter-latin-ext-600-normal.woff', 600, 'InterExt'),
];

const CAT = {
  turkiye: { label: 'TÜRKİYE', color: '#0A7CFF', soft: '#EAF3FF' },
  dunya: { label: 'DÜNYA', color: '#3B5BFD', soft: '#EEF1FF' },
  rehber: { label: 'REHBER', color: '#12A150', soft: '#E8F7EE' },
};
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const BOLT = 'M22.5 7 12 22.2h7.2L16.8 33 28 17.6h-7.3L22.5 7Z';
const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } });

function emblem(size) {
  return {
    type: 'svg',
    props: {
      width: size, height: size, viewBox: '0 0 40 40',
      children: [
        { type: 'defs', props: { children: { type: 'linearGradient', props: { id: 'g', x1: '0', y1: '0', x2: '1', y2: '1', children: [
          { type: 'stop', props: { offset: '0', stopColor: '#12A150' } },
          { type: 'stop', props: { offset: '1', stopColor: '#0A7CFF' } },
        ] } } } },
        { type: 'rect', props: { x: 1, y: 1, width: 38, height: 38, rx: 11, fill: 'url(#g)' } },
        { type: 'path', props: { d: BOLT, fill: '#fff' } },
      ],
    },
  };
}

function cover({ title, category, date }) {
  const c = CAT[category] ?? CAT.turkiye;
  const d = new Date(date);
  const dateStr = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const size = title.length > 90 ? 64 : title.length > 60 ? 74 : 84;
  return h('div', { width: 1600, height: 900, display: 'flex', flexDirection: 'column', background: '#FFFFFF', position: 'relative', fontFamily: 'Jakarta, JakartaExt', backgroundImage: `radial-gradient(circle at 92% 8%, ${c.soft} 0%, ${c.soft} 28%, rgba(255,255,255,0) 28.2%)` },
    // Arka plan: kategori renginde yumuşak daire ve büyük şimşek filigranı
    { type: 'svg', props: { width: 300, height: 420, viewBox: '6 4 28 32', style: { position: 'absolute', right: 110, top: 60, opacity: 0.16 }, children: { type: 'path', props: { d: BOLT, fill: c.color } } } },
    // Üst: logo
    h('div', { display: 'flex', alignItems: 'center', padding: '72px 96px 0', gap: 18 },
      emblem(64),
      h('div', { display: 'flex', fontSize: 46, color: '#0E1726', letterSpacing: -1.5 },
        h('span', { fontWeight: 800 }, 'EV'), h('span', { fontWeight: 500, marginLeft: 12 }, 'Türkiye'))),
    // Orta: kategori + başlık
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', padding: '0 96px', gap: 30, maxWidth: 1320 },
      h('div', { display: 'flex' }, h('div', { display: 'flex', background: c.color, color: '#fff', fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 26, letterSpacing: 5, padding: '10px 22px' }, c.label)),
      h('div', { display: 'flex', fontSize: size, fontWeight: 800, color: '#0E1726', lineHeight: 1.14, letterSpacing: -2 }, title)),
    // Alt: tarih + site + degrade şerit
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 96px 64px', fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 28, color: '#475569' },
      h('span', {}, dateStr), h('span', { color: '#0A7CFF' }, 'evturkiye.online')),
    h('div', { display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, backgroundImage: 'linear-gradient(90deg, #12A150, #0A7CFF)' }));
}

let made = 0, skipped = 0;
for (const file of fs.readdirSync(NEWS).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const { data } = matter(fs.readFileSync(path.join(NEWS, file), 'utf8'));
  const real = data.image && !/^https?:/.test(data.image) && fs.existsSync(path.join('public', data.image));
  const out = path.join(OUT, `${slug}.png`);
  if (real) { if (fs.existsSync(out)) fs.rmSync(out); skipped++; continue; }
  const svg = await satori(cover({ title: data.title, category: data.category, date: data.date }), { width: 1600, height: 900, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1600 } }).render().asPng();
  fs.writeFileSync(out, png);
  made++;
}
console.log(`[kapak] ${made} otomatik kapak üretildi, ${skipped} haberin gerçek görseli var`);
