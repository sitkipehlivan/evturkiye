// Araç sayfaları için paylaşım/Discover kapakları (1600x900): rota planlayıcı, yakınımdaki şarj, karşılaştırma, şarj fiyatları, istasyon haritası, rota sayfaları.
// Çıktı: public/images/araclar/*.png — logo yerine sayfanın ne yaptığını gösteren görseller (Google Discover logo görselini sevmez).
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const OUT = 'public/images/araclar';
const F = 'scripts/fonts';
fs.mkdirSync(OUT, { recursive: true });
const font = (file, weight, name) => ({ name, weight, style: 'normal', data: fs.readFileSync(path.join(F, file)) });
const fonts = [
  font('plus-jakarta-sans-latin-800-normal.woff', 800, 'Jakarta'), font('plus-jakarta-sans-latin-ext-800-normal.woff', 800, 'JakartaExt'),
  font('plus-jakarta-sans-latin-500-normal.woff', 500, 'Jakarta'), font('plus-jakarta-sans-latin-ext-500-normal.woff', 500, 'JakartaExt'),
  font('inter-latin-600-normal.woff', 600, 'Inter'), font('inter-latin-ext-600-normal.woff', 600, 'InterExt'),
];
const GREEN = '#12A150', BLUE = '#0A7CFF', INK = '#0E1726', MUTED = '#475569';
const BOLT = 'M22.5 7 12 22.2h7.2L16.8 33 28 17.6h-7.3L22.5 7Z';
const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children } });
const svg = (w, hh, vb, kids, style = {}) => ({ type: 'svg', props: { width: w, height: hh, viewBox: vb, style, children: kids } });
const el = (type, props) => ({ type, props });
const grad = (id) => el('defs', { children: el('linearGradient', { id, x1: '0', y1: '0', x2: '1', y2: '1', children: [el('stop', { offset: '0', stopColor: GREEN }), el('stop', { offset: '1', stopColor: BLUE })] }) });
const emblem = (size) => svg(size, size, '0 0 40 40', [grad('g'), el('rect', { x: 1, y: 1, width: 38, height: 38, rx: 11, fill: 'url(#g)' }), el('path', { d: BOLT, fill: '#fff' })]);
const pinBolt = (x, y, s, color) => [
  el('circle', { cx: x, cy: y, r: s, fill: color }),
  el('path', { d: BOLT, fill: '#fff', transform: `translate(${x - s * 0.6} ${y - s * 0.62}) scale(${s / 33})` }),
];

// Sağdaki görsel paneller
const route = () => svg(640, 620, '0 0 640 620', [
  el('rect', { x: 0, y: 0, width: 640, height: 620, rx: 36, fill: '#F1F6FF' }),
  el('path', { d: 'M90 520 C 180 470, 150 360, 260 330 S 420 300, 430 200 S 520 110, 560 90', stroke: '#C7D7EE', strokeWidth: 34, fill: 'none', strokeLinecap: 'round' }),
  el('path', { d: 'M90 520 C 180 470, 150 360, 260 330 S 420 300, 430 200 S 520 110, 560 90', stroke: BLUE, strokeWidth: 12, fill: 'none', strokeLinecap: 'round', strokeDasharray: '1 0' }),
  el('circle', { cx: 90, cy: 520, r: 22, fill: INK }), el('circle', { cx: 90, cy: 520, r: 9, fill: '#fff' }),
  ...pinBolt(262, 330, 36, GREEN), ...pinBolt(430, 205, 36, GREEN),
  el('circle', { cx: 560, cy: 90, r: 26, fill: BLUE }), el('circle', { cx: 560, cy: 90, r: 10, fill: '#fff' }),
]);
const near = () => svg(640, 620, '0 0 640 620', [
  el('rect', { x: 0, y: 0, width: 640, height: 620, rx: 36, fill: '#EEF8F2' }),
  el('circle', { cx: 320, cy: 320, r: 250, fill: 'none', stroke: '#CDE9D8', strokeWidth: 3 }),
  el('circle', { cx: 320, cy: 320, r: 160, fill: 'none', stroke: '#B5DFC6', strokeWidth: 3 }),
  el('circle', { cx: 320, cy: 320, r: 75, fill: 'rgba(10,124,255,0.12)' }),
  el('circle', { cx: 320, cy: 320, r: 24, fill: BLUE, stroke: '#fff', strokeWidth: 8 }),
  ...pinBolt(190, 230, 34, GREEN), ...pinBolt(450, 205, 34, GREEN), ...pinBolt(470, 430, 34, GREEN), ...pinBolt(150, 450, 30, '#0E8C99'), ...pinBolt(360, 520, 28, '#0E8C99'),
]);
const bars = (rows, colors) => h('div', { display: 'flex', flexDirection: 'column', width: 640, height: 620, borderRadius: 36, background: '#F4F7FB', padding: '56px 52px', gap: 34, justifyContent: 'center' },
  ...rows.map(([label, a, b]) => h('div', { display: 'flex', flexDirection: 'column', gap: 12 },
    h('div', { display: 'flex', fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 26, color: MUTED }, label),
    h('div', { display: 'flex', height: 26, width: `${a}%`, borderRadius: 13, background: colors[0] }),
    h('div', { display: 'flex', height: 26, width: `${b}%`, borderRadius: 13, background: colors[1] }))));
const prices = (rows) => h('div', { display: 'flex', flexDirection: 'column', width: 640, height: 620, borderRadius: 36, background: '#F4F7FB', padding: '48px 52px', gap: 18, justifyContent: 'center' },
  ...rows.map(([n, v, best]) => h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 20, padding: '22px 30px', border: best ? `4px solid ${GREEN}` : '2px solid #E2E8F0' },
    h('span', { display: 'flex', fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 32, color: INK }, n),
    h('span', { display: 'flex', fontWeight: 800, fontSize: 38, color: best ? GREEN : INK }, v))));

function cover({ tag, title, sub, art, color = BLUE }) {
  return h('div', { width: 1600, height: 900, display: 'flex', background: '#FFFFFF', fontFamily: 'Jakarta, JakartaExt', position: 'relative' },
    h('div', { display: 'flex', flexDirection: 'column', width: 860, padding: '72px 40px 72px 96px', justifyContent: 'space-between' },
      h('div', { display: 'flex', alignItems: 'center', gap: 18 }, emblem(60),
        h('div', { display: 'flex', fontSize: 44, color: INK, letterSpacing: -1.5 }, h('span', { fontWeight: 800 }, 'EV'), h('span', { fontWeight: 500, marginLeft: 12 }, 'Türkiye'))),
      h('div', { display: 'flex', flexDirection: 'column', gap: 26 },
        h('div', { display: 'flex' }, h('div', { display: 'flex', background: color, color: '#fff', fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 24, letterSpacing: 4, padding: '10px 20px' }, tag)),
        h('div', { display: 'flex', fontSize: title.length > 34 ? 70 : 80, fontWeight: 800, color: INK, lineHeight: 1.08, letterSpacing: -1.2 }, title),
        h('div', { display: 'flex', fontSize: 32, fontWeight: 500, color: MUTED, lineHeight: 1.35 }, sub)),
      h('div', { display: 'flex', fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 28, color: BLUE }, 'evturkiye.online · Ücretsiz')),
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 740, paddingRight: 70 }, art),
    h('div', { display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, backgroundImage: `linear-gradient(90deg, ${GREEN}, ${BLUE})` }));
}

const ops = JSON.parse(fs.readFileSync('src/data/operators.json', 'utf8')).operators.filter((o) => o.dc).sort((a, b) => a.dc - b.dc);
const tl = (v) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
const list = [
  ['rota-planlayici', { tag: 'ROTA PLANLAYICI', title: 'Uzun yolda şarj durakları ve yol maliyeti', sub: 'Aracını ve rotanı seç; nerede, ne kadar şarj edeceğini ve toplam maliyeti gör.', art: route() }],
  ['yakindaki-sarj', { tag: 'YAKINIMDAKI ŞARJ', title: 'En yakın şarj istasyonu nerede?', sub: 'Çevrendeki istasyonlar; güç, soket tipi ve kWh fiyatıyla. Tek dokunuşla yol tarifi.', art: near(), color: GREEN }],
  ['karsilastir', { tag: 'KARŞILAŞTIR', title: 'Elektrikli araçları yan yana karşılaştır', sub: 'Fiyat, gerçek otoyol menzili, şarj süresi ve 100 km maliyeti tek tabloda.', art: bars([['Otoyol menzili', 82, 74], ['Hızlı şarj süresi', 58, 76], ['100 km maliyeti', 64, 48]], [GREEN, BLUE]) }],
  ['sarj-fiyatlari', { tag: 'ŞARJ FIYATLARI', title: 'En ucuz hızlı şarj hangi operatörde?', sub: `${ops.length} operatörün güncel AC ve DC kWh fiyatları, karşılaştırmalı.`, art: prices(ops.slice(0, 4).map((o, i) => [o.name, tl(o.dc), i === 0])), color: GREEN }],
  ['istasyonlar', { tag: 'ISTASYON HARITASI', title: "Türkiye'nin şarj istasyonu haritası", sub: 'DC hızlı şarj ve operatöre göre filtrele, rotanı ona göre planla.', art: near(), color: '#0E8C99' }],
  ['rota', { tag: 'POPÜLER ROTA', title: 'Elektrikliyle kaç durakta, kaça gidilir?', sub: 'Şarj durakları ve yol maliyeti; benzinli ve dizelle karşılaştırmalı.', art: route() }],
];
for (const [name, c] of list) {
  const s = await satori(cover(c), { width: 1600, height: 900, fonts });
  fs.writeFileSync(path.join(OUT, `${name}.png`), new Resvg(s, { fitTo: { mode: 'width', value: 1600 } }).render().asPng());
}
console.log(`[arac-kapak] ${list.length} kapak üretildi`);
