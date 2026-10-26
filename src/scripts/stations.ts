// İstasyon veri kaynağı: önce build sırasında üretilen statik dosya,
// o yoksa canlı Overpass sorgusu (yedek).
import { parseOsm, type Station } from './planner-core';

export type BaseStation = Omit<Station, 'along' | 'offset'>;
export type Box = [number, number, number, number]; // s, w, n, e

export const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

let staticPromise: Promise<{ updated: string | null; stations: BaseStation[] } | null> | null = null;

export function loadStatic() {
  staticPromise ??= fetch('/data/stations.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j?.stations?.length) return null;
      const stations: BaseStation[] = j.stations.map((r: any[]) => ({
        lat: r[0], lon: r[1], dc: r[2] === 1 ? true : r[2] === 0 ? false : null,
        powerKw: r[3] || null, operator: r[4] || '', name: r[5] || r[4] || 'Şarj istasyonu', id: r[6],
      }));
      return { updated: j.updated as string | null, stations };
    })
    .catch(() => null);
  return staticPromise;
}

const inBox = (s: BaseStation, b: Box) => s.lat >= b[0] && s.lat <= b[2] && s.lon >= b[1] && s.lon <= b[3];

export async function overpass(q: string): Promise<any> {
  const body = 'data=' + encodeURIComponent(q);
  for (const ep of OVERPASS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(ep, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch { /* sıradaki sunucuyu dene */ } finally { clearTimeout(t); }
  }
  throw new Error('İstasyon verisine şu an ulaşılamıyor. Biraz sonra tekrar deneyin.');
}

/** Verilen kutulardaki istasyonlar (tekilleştirilmiş). */
export async function stationsInBoxes(boxes: Box[]): Promise<BaseStation[]> {
  const st = await loadStatic();
  if (st) return st.stations.filter((s) => boxes.some((b) => inBox(s, b)));
  const q = `[out:json][timeout:25];(${boxes.map((b) => {
    const bb = b.map((v) => v.toFixed(3)).join(',');
    return `node["amenity"="charging_station"](${bb});way["amenity"="charging_station"](${bb});`;
  }).join('')});out center tags;`;
  const j = await overpass(q);
  const seen = new Set<string>();
  const out: BaseStation[] = [];
  for (const el of j.elements || []) {
    const s = parseOsm(el);
    if (s && !seen.has(s.id)) { seen.add(s.id); out.push(s); }
  }
  return out;
}
