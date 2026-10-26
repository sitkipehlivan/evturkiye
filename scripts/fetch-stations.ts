// Build öncesi: Türkiye'deki tüm şarj istasyonlarını OpenStreetMap'ten çekip
// public/data/stations.json dosyasına yazar. Başarısız olursa mevcut dosyayı korur
// ve build'i durdurmaz.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { parseOsm } from '../src/scripts/planner-core.ts';

const OUT = 'public/data/stations.json';
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const QUERY = '[out:json][timeout:180];area["ISO3166-1"="TR"][admin_level=2]->.tr;(node["amenity"="charging_station"](area.tr);way["amenity"="charging_station"](area.tr););out center tags;';

async function tryFetch(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 200_000);
  try {
    const res = await fetch(url, {
      method: 'POST', signal: ctrl.signal,
      body: 'data=' + encodeURIComponent(QUERY),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'evturkiye.com.tr build (stations)' },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(t); }
}

async function main() {
  if (process.env.SKIP_STATIONS) { console.log('[stations] SKIP_STATIONS set, skipping'); return; }
  for (let round = 0; round < 2; round++) {
    for (const m of MIRRORS) {
      try {
        console.log(`[stations] ${m} deneniyor…`);
        const j = await tryFetch(m);
        const rows: any[] = [];
        for (const el of j.elements || []) {
          const s = parseOsm(el);
          if (!s) continue;
          rows.push([+s.lat.toFixed(5), +s.lon.toFixed(5), s.dc === true ? 1 : s.dc === false ? 0 : -1, s.powerKw ?? 0, s.operator || '', s.name === s.operator ? '' : s.name, s.id]);
        }
        if (rows.length < 200) throw new Error('çok az kayıt: ' + rows.length);
        writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), count: rows.length, stations: rows }));
        console.log(`[stations] ${rows.length} istasyon yazıldı`);
        return;
      } catch (e: any) {
        console.warn(`[stations] başarısız: ${e.message}`);
      }
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  if (existsSync(OUT)) {
    const old = JSON.parse(readFileSync(OUT, 'utf8'));
    console.warn(`[stations] Güncellenemedi; mevcut dosya korunuyor (${old.count} kayıt, ${old.updated})`);
  } else {
    writeFileSync(OUT, JSON.stringify({ updated: null, count: 0, stations: [] }));
    console.warn('[stations] Veri yok; site canlı sorguya düşecek');
  }
}
main();
