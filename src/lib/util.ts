import { getCollection } from 'astro:content';

export const CATS = {
  turkiye: { label: 'Türkiye', desc: 'Yerli üretim, ÖTV ve vergi düzenlemeleri, yeni modeller ve şarj altyapısı yatırımları.' },
  dunya: { label: 'Dünya', desc: 'Tesla, BYD ve diğer üreticilerden gelişmeler, batarya teknolojileri ve küresel trendler.' },
  rehber: { label: 'Rehber', desc: 'Elektrikli araç alırken, şarj ederken ve uzun yola çıkarken bilmeniz gerekenler.' },
} as const;
export type Cat = keyof typeof CATS;

export const fmtDate = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
export const tl = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺');

export async function getNews() {
  const all = await getCollection('haberler', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export async function getDeals() {
  const now = Date.now() - 864e5;
  const all = await getCollection('firsatlar', ({ data }) => !data.draft);
  return all
    .filter((d) => !d.data.endDate || d.data.endDate.getTime() >= now)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

import { existsSync } from 'node:fs';
/** Görsel public/ altında gerçekten varsa yolunu döndürür; yoksa undefined (yer tutucu çizim gösterilir). */
export function imgIfExists(path?: string) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return existsSync(`public${path}`) ? path : undefined;
}
