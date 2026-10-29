// Araç karşılaştırma: hem sunucuda (hazır karşılaştırma sayfaları) hem tarayıcıda (araç) kullanılan saf fonksiyonlar.
export interface CCar {
  slug: string; brand: string; brandSlug: string; model: string; modelSlug: string; version: string; body: string;
  battery: number; wltp: number; dcMax: number; acMax: number; highway: number;
  hp?: number; accel?: number; priceTL?: number; priceDate?: string; discontinued?: boolean; img?: string;
}
export interface Ctx { avgDc: number; avgAc: number; }

const EFF = 0.93;
const nf = (v: number, d = 0) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
const tl = (v: number, d = 0) => nf(v, d) + ' TL';
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const month = (s?: string) => { if (!s) return ''; const [y, m] = s.split('-').map(Number); return `${AY[m - 1]} ${y}`; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export const name = (c: CCar) => `${c.brand} ${c.model}`;
export const hwRange = (c: CCar) => Math.round((c.battery / c.highway) * 100);
export const winterRange = (c: CCar) => Math.round(hwRange(c) * 0.8);
export const dcMin = (c: CCar) => Math.round(((c.battery * 0.7) / (c.dcMax * 0.68)) * 60);
export const acHours = (c: CCar) => c.battery / EFF / c.acMax;
export const cost100 = (c: CCar, p: number) => (c.highway / EFF) * p;
export const kmPer10min = (c: CCar) => Math.round(((c.dcMax * 0.68 * 10) / 60 / c.highway) * 100);

interface Row { label: string; hint?: string; vals: (number | undefined)[]; fmt: (v: number) => string; better?: 'hi' | 'lo'; }

export function rows(cars: CCar[], ctx: Ctx): { group: string; rows: Row[] }[] {
  const v = <T,>(f: (c: CCar) => T) => cars.map(f);
  return [
    { group: 'Fiyat', rows: [
      { label: 'Liste fiyatı', vals: v((c) => (c.discontinued ? undefined : c.priceTL)), fmt: (x) => tl(x), better: 'lo' },
      { label: 'Menzil başına fiyat', hint: 'Liste fiyatı ÷ otoyol menzili', vals: v((c) => (c.priceTL && !c.discontinued ? c.priceTL / hwRange(c) : undefined)), fmt: (x) => tl(x) + '/km', better: 'lo' },
    ] },
    { group: 'Menzil ve verimlilik', rows: [
      { label: 'WLTP menzil', vals: v((c) => c.wltp), fmt: (x) => nf(x) + ' km', better: 'hi' },
      { label: 'Otoyol menzili', hint: '110–120 km/s, ılık hava (tahmini)', vals: v(hwRange), fmt: (x) => '~' + nf(x) + ' km', better: 'hi' },
      { label: 'Kışın otoyol menzili', hint: 'Soğuk havada ~%20 düşüş varsayımıyla', vals: v(winterRange), fmt: (x) => '~' + nf(x) + ' km', better: 'hi' },
      { label: 'Otoyol tüketimi', vals: v((c) => c.highway), fmt: (x) => nf(x, 1) + ' kWh/100 km', better: 'lo' },
      { label: 'Batarya (kullanılabilir)', vals: v((c) => c.battery), fmt: (x) => nf(x, x % 1 ? 1 : 0) + ' kWh', better: 'hi' },
    ] },
    { group: 'Şarj', rows: [
      { label: 'DC hızlı şarj (maks.)', vals: v((c) => c.dcMax), fmt: (x) => nf(x) + ' kW', better: 'hi' },
      { label: '%10 → %80 DC süresi', vals: v(dcMin), fmt: (x) => '~' + nf(x) + ' dk', better: 'lo' },
      { label: '10 dakikada kazanılan menzil', hint: 'Ortalama DC şarj gücüyle, otoyolda', vals: v(kmPer10min), fmt: (x) => '~' + nf(x) + ' km', better: 'hi' },
      { label: 'AC şarj (maks.)', vals: v((c) => c.acMax), fmt: (x) => nf(x, x % 1 ? 1 : 0) + ' kW', better: 'hi' },
      { label: '%0 → %100 AC süresi', vals: v(acHours), fmt: (x) => '~' + nf(x, 1).replace(',0', '') + ' saat', better: 'lo' },
    ] },
    { group: 'Maliyet', rows: [
      { label: '100 km (halka açık DC)', hint: `Operatör ortalaması ${nf(ctx.avgDc, 2)} TL/kWh`, vals: v((c) => cost100(c, ctx.avgDc)), fmt: (x) => tl(x), better: 'lo' },
      { label: '100 km (halka açık AC)', hint: `Operatör ortalaması ${nf(ctx.avgAc, 2)} TL/kWh`, vals: v((c) => cost100(c, ctx.avgAc)), fmt: (x) => tl(x), better: 'lo' },
      { label: 'Yılda 15.000 km (DC)', vals: v((c) => cost100(c, ctx.avgDc) * 150), fmt: (x) => tl(Math.round(x / 100) * 100), better: 'lo' },
    ] },
    { group: 'Performans', rows: [
      { label: 'Güç', vals: v((c) => c.hp), fmt: (x) => nf(x) + ' PS', better: 'hi' },
      { label: '0–100 km/s', vals: v((c) => c.accel), fmt: (x) => nf(x, 1) + ' sn', better: 'lo' },
    ] },
  ];
}

/** Verilere dayalı artı ve eksiler (karşılaştırılan diğer araçlara göre ve genel eşiklerle). */
export function prosCons(cars: CCar[], ctx: Ctx) {
  const out = cars.map(() => ({ pros: [] as string[], cons: [] as string[] }));
  const multi = cars.length > 1;
  const cmp = (f: (c: CCar) => number | undefined, better: 'hi' | 'lo', pro: (d: string) => string, con: (d: string) => string, fmt: (x: number) => string, minDiff: number) => {
    const vals = cars.map(f);
    const ok = vals.filter((x): x is number => x != null);
    if (!multi || ok.length < 2) return;
    const best = better === 'hi' ? Math.max(...ok) : Math.min(...ok);
    const worst = better === 'hi' ? Math.min(...ok) : Math.max(...ok);
    if (Math.abs(best - worst) < minDiff) return;
    vals.forEach((x, i) => {
      if (x == null) return;
      if (x === best) out[i].pros.push(pro(fmt(Math.abs(best - worst))));
      else if (x === worst) out[i].cons.push(con(fmt(Math.abs(best - x))));
    });
  };
  cmp((c) => (c.discontinued ? undefined : c.priceTL), 'lo', (d) => `Daha uygun fiyat (${d} daha ucuz)`, (d) => `Daha pahalı (+${d})`, (x) => tl(Math.round(x / 1000) * 1000), 50000);
  cmp(hwRange, 'hi', (d) => `Otoyolda daha uzun menzil (+${d})`, (d) => `Otoyolda daha kısa menzil (−${d})`, (x) => nf(x) + ' km', 25);
  cmp(dcMin, 'lo', (d) => `Hızlı şarjda daha kısa mola (${d} daha az)`, (d) => `Hızlı şarj molası daha uzun (+${d})`, (x) => nf(x) + ' dk', 4);
  cmp((c) => c.highway, 'lo', (d) => `Daha verimli (${d} daha az tüketim)`, (d) => `Daha fazla tüketiyor (+${d})`, (x) => nf(x, 1) + ' kWh/100 km', 1.5);
  cmp((c) => c.hp, 'hi', (d) => `Daha güçlü (+${d})`, (d) => `Daha az güçlü (−${d})`, (x) => nf(x) + ' PS', 30);
  cmp((c) => c.accel, 'lo', (d) => `Daha seri hızlanma (${d} daha hızlı)`, (d) => `Hızlanma daha yavaş (+${d})`, (x) => nf(x, 1) + ' sn', 1);
  cars.forEach((c, i) => {
    const o = out[i];
    if (c.acMax >= 22) o.pros.push('22 kW AC şarj desteği (AC istasyonda çok daha hızlı dolar)');
    if (c.acMax < 11) o.cons.push(`AC şarj ${nf(c.acMax, 1)} kW ile sınırlı (11 kW istasyonda bile yavaş)`);
    if (c.dcMax >= 200) o.pros.push(`Yüksek DC şarj gücü (${c.dcMax} kW)`);
    if (c.dcMax < 100) o.cons.push(`DC şarj gücü düşük (${c.dcMax} kW): uzun yolda molalar uzar`);
    if (hwRange(c) >= 450) o.pros.push(`Otoyolda ~${hwRange(c)} km: İstanbul–Ankara tek şarjla rahat`);
    else if (hwRange(c) < 280) o.cons.push(`Otoyol menzili ~${hwRange(c)} km: uzun yolda sık şarj molası`);
    if (c.highway <= 16) o.pros.push(`Çok verimli: 100 km ~${nf(cost100(c, ctx.avgDc), 0)} TL (DC)`);
    if (c.discontinued) o.cons.push('Türkiye\'de yeni olarak satışta değil');
  });
  return out;
}

export function verdict(cars: CCar[]): string {
  if (cars.length < 2) return '';
  const by = <T,>(f: (c: CCar) => number | undefined, hi: boolean) => {
    const ok = cars.filter((c) => f(c) != null);
    if (!ok.length) return null;
    return ok.reduce((a, b) => ((hi ? f(b)! > f(a)! : f(b)! < f(a)!) ? b : a));
  };
  const parts: string[] = [];
  const cheap = by((c) => (c.discontinued ? undefined : c.priceTL), false);
  const range = by(hwRange, true);
  const fast = by(dcMin, false);
  const eff = by((c) => c.highway, false);
  if (cheap) parts.push(`<b>Bütçe önceliğiyse</b> ${esc(name(cheap))} öne çıkıyor.`);
  if (range) parts.push(`<b>Uzun yolda menzil</b> arıyorsan ${esc(name(range))} (~${hwRange(range)} km otoyol).`);
  if (fast && fast !== range) parts.push(`<b>Hızlı şarj molası</b> en kısa olan ${esc(name(fast))} (~${dcMin(fast)} dk, %10→80).`);
  if (eff && eff !== cheap) parts.push(`<b>En düşük işletme maliyeti</b> ${esc(name(eff))}.`);
  return parts.join(' ');
}

/** Karşılaştırma tablosunun HTML'i (sunucu ve tarayıcı aynı çıktıyı üretir). */
export function renderCompare(cars: CCar[], ctx: Ctx): string {
  if (!cars.length) return '';
  const pc = prosCons(cars, ctx);
  const head = cars.map((c) => `
    <div class="cp-car">
      <a href="/modeller/${c.brandSlug}/${c.modelSlug}" class="cp-img">${c.img ? `<img src="${c.img}" alt="${esc(name(c))}" loading="lazy" width="400" height="225">` : `<span><small>${esc(c.brand)}</small>${esc(c.model)}</span>`}</a>
      <b class="cp-name">${esc(name(c))}</b>
      <span class="cp-ver">${esc(c.version)} · ${esc(c.body)}</span>
      ${c.discontinued ? '<span class="cp-off">Satıştan kalktı</span>' : c.priceTL ? `<span class="cp-price">${tl(c.priceTL)}<small>${month(c.priceDate)} liste fiyatı</small></span>` : '<span class="cp-ver">Fiyat açıklanmadı</span>'}
      <a class="cp-route" href="/rota-planlayici?car=${c.slug}">Bu araçla rota planla →</a>
    </div>`).join('');
  const groups = rows(cars, ctx).map((g) => {
    const body = g.rows.map((r) => {
      const ok = r.vals.filter((x): x is number => x != null);
      const best = cars.length > 1 && ok.length > 1 && r.better ? (r.better === 'hi' ? Math.max(...ok) : Math.min(...ok)) : null;
      const allSame = ok.length > 1 && ok.every((x) => x === ok[0]);
      return `<tr><th scope="row">${r.label}${r.hint ? `<small>${r.hint}</small>` : ''}</th>${r.vals.map((x) => `<td class="${best != null && !allSame && x === best ? 'best' : ''}">${x == null ? '—' : r.fmt(x)}</td>`).join('')}</tr>`;
    }).join('');
    return `<tr class="cp-g"><th colspan="${cars.length + 1}">${g.group}</th></tr>${body}`;
  }).join('');
  const pros = cars.map((c, i) => `
    <div class="cp-pc">
      <b>${esc(name(c))}</b>
      <ul class="pro">${pc[i].pros.map((x) => `<li>${esc(x)}</li>`).join('') || '<li class="none">Öne çıkan bir üstünlüğü yok</li>'}</ul>
      <ul class="con">${pc[i].cons.map((x) => `<li>${esc(x)}</li>`).join('') || '<li class="none">Belirgin bir zayıf yönü yok</li>'}</ul>
    </div>`).join('');
  const v = verdict(cars);
  return `
    <div class="cp-head" style="--n:${cars.length}">${head}</div>
    ${v ? `<p class="cp-verdict">${v}</p>` : ''}
    <div class="cp-tablewrap"><table class="cp-table" style="--n:${cars.length}"><tbody>${groups}</tbody></table></div>
    <h2 class="cp-h">Artılar ve eksiler</h2>
    <div class="cp-pcs" style="--n:${cars.length}">${pros}</div>
    <p class="cp-note">Artı ve eksiler, sitedeki teknik verilerden otomatik çıkarılır; donanım, güvenlik paketleri ve garanti koşulları versiyona göre değişir, satın almadan önce distribütörün güncel donanım listesine bakın. Otoyol menzili, şarj süresi ve maliyetler tahminidir.</p>`;
}
