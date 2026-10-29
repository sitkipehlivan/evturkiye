// Konu (rehber) sayfaları ve marka sayfaları için ortak hesaplar.
import data from '../data/models.json';
import ops from '../data/operators.json';
import images from '../data/model-images.json';

export const CHARGE_EFF = 0.93;
export interface Model {
  slug: string; brand: string; brandSlug: string; model: string; modelSlug: string; version: string; body: string;
  battery: number; wltp: number; dcMax: number; acMax: number; highway: number;
  hp?: number; accel?: number; priceTL?: number; priceDate?: string; priceSource?: string; wiki?: string;
}
export const models = data.models as Model[];

/** Model (marka+model) bazında gruplar: versiyonlar, fotoğraf, başlangıç fiyatı */
export interface ModelGroup { key: string; brand: string; brandSlug: string; model: string; modelSlug: string; body: string; versions: Model[]; image?: { src: string; credit: string }; fromPrice?: number; priceDate?: string; wltpMax: number; }
const imgMap = images as Record<string, { src: string; credit: string }>;
export const modelGroups: ModelGroup[] = (() => {
  const map = new Map<string, Model[]>();
  for (const m of models) { const k = `${m.brandSlug}/${m.modelSlug}`; map.set(k, [...(map.get(k) ?? []), m]); }
  return [...map.entries()].map(([key, versions]) => {
    const priced = versions.filter((v) => v.priceTL);
    const cheapest = priced.sort((a, b) => a.priceTL! - b.priceTL!)[0];
    const v0 = versions[0];
    return { key, brand: v0.brand, brandSlug: v0.brandSlug, model: v0.model, modelSlug: v0.modelSlug, body: v0.body, versions,
      image: imgMap[key], fromPrice: cheapest?.priceTL, priceDate: cheapest?.priceDate, wltpMax: Math.max(...versions.map((v) => v.wltp)) };
  });
})();
export const groupOf = (brandSlug: string, modelSlug: string) => modelGroups.find((g) => g.brandSlug === brandSlug && g.modelSlug === modelSlug)!;
/** 2650000 -> "2.650.000 TL" */
export const price = (v?: number) => (v ? v.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL' : '');
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
/** "2026-10" -> "Ekim 2026" */
export const monthTr = (s?: string) => { if (!s) return ''; const [y, m] = s.split('-').map(Number); return `${AYLAR[m - 1]} ${y}`; };

const acList = ops.operators.filter((o) => o.ac != null).map((o) => o.ac as number);
const dcList = ops.operators.map((o) => o.dc);
const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
export const avgAc = avg(acList);
export const avgDc = avg(dcList);
export const minAc = Math.min(...acList);
export const minDc = Math.min(...dcList);
export const maxDc = Math.max(...dcList);
export const opsUpdated = ops.updated;
export const opsCount = ops.operators.length;

export const fullName = (m: Model) => `${m.brand} ${m.model} ${m.version}`;
/** Otoyolda (110–120 km/s) tahmini menzil */
export const highwayRange = (m: Model) => Math.round((m.battery / m.highway) * 100);
/** %10 → %80 DC şarj süresi (ort. güç ≈ maks. gücün %68'i) */
export const dcMinutes = (m: Model) => Math.round(((m.battery * 0.7) / (m.dcMax * 0.68)) * 60);
/** %0 → %100 AC şarj süresi (saat) */
export const acHours = (m: Model) => m.battery / CHARGE_EFF / m.acMax;
/** 100 km maliyeti (otoyol tüketimi, verilen kWh fiyatıyla) */
export const per100 = (m: Model, price: number) => (m.highway / CHARGE_EFF) * price;
/** %10 → %80 şarjın maliyeti */
export const chargeCost = (m: Model, price: number) => ((m.battery * 0.7) / CHARGE_EFF) * price;

export const brands = [...new Map(models.map((m) => [m.brandSlug, m.brand])).entries()].map(([slug, name]) => ({
  slug, name, count: models.filter((m) => m.brandSlug === slug).length,
}));

/** Rehber sayfalarında haberlere iç link verirken kullanılan konu sayfaları */
export const GUIDES = [
  { href: '/elektrikli-arac', label: 'Elektrikli Araç Rehberi', short: 'Elektrikli araç rehberi', desc: 'Menzil, şarj, maliyet ve modeller tek sayfada.' },
  { href: '/elektrikli-arac-sarj', label: 'Elektrikli Araç Şarj Rehberi', short: 'Şarj rehberi', desc: 'AC/DC şarj, soket tipleri, şarj süreleri.' },
  { href: '/elektrikli-arac-menzil', label: 'Elektrikli Araç Menzil Sıralaması', short: 'Menzil sıralaması', desc: 'WLTP ve gerçekçi otoyol menzili.' },
  { href: '/elektrikli-arac-sarj-maliyeti', label: 'Elektrikli Araç Şarj Maliyeti', short: 'Şarj maliyeti', desc: '100 km ve tam şarj maliyeti, model model.' },
];
