// Rota & şarj planlama çekirdeği — DOM'dan bağımsız, test edilebilir.

export type LatLon = [number, number];

export interface Operator {
  id: string; name: string; ac: number | null; dc: number; dcMin?: number; note?: string; match: string[];
}

export interface Station {
  id: string; lat: number; lon: number; name: string; operator: string;
  powerKw: number | null; dc: boolean | null; along: number; offset: number;
}

export interface PriceInfo { price: number; opName: string; opId: string | null; estimated: boolean; }

export interface Alternative { station: Station; price: PriceInfo; cost: number; diffKm: number; }

export interface Stop {
  station: Station; price: PriceInfo; arrivalSoc: number; departSoc: number;
  energyKwh: number; minutes: number; cost: number; powerUsed: number;
  cheaper: Alternative | null; alternatives: Alternative[]; uncertainDc: boolean;
}

export interface PlanInput {
  routeKm: number; durationS: number; battery: number; consumption: number; // kWh/km
  carDcMax: number; startSoc: number; reserve?: number; targetSoc?: number;
  mode: 'fast' | 'eco'; stations: Station[]; operators: Operator[];
}

export interface PlanResult {
  ok: boolean; error?: string; stops: Stop[]; arrivalSoc: number;
  totalEnergy: number; totalCost: number; chargeMinutes: number; driveMinutes: number;
  tripEnergy: number; costPer100: number; homeChargeCost?: number;
}

const R = 6371;
export function haversine(a: LatLon, b: LatLon): number {
  const toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function cumulative(coords: LatLon[]): number[] {
  const out = [0];
  for (let i = 1; i < coords.length; i++) out.push(out[i - 1] + haversine(coords[i - 1], coords[i]));
  return out;
}

/** Rotayı ~stepKm aralıklı noktalara indirger (Overpass sorgusu için). */
export function sample(coords: LatLon[], cum: number[], stepKm: number): LatLon[] {
  const out: LatLon[] = [coords[0]];
  let next = stepKm;
  for (let i = 1; i < coords.length; i++) {
    if (cum[i] >= next) { out.push(coords[i]); next = cum[i] + stepKm; }
  }
  const last = coords[coords.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

/** Noktanın rota üzerindeki konumu (km) ve rotaya uzaklığı (km). */
export function locate(coords: LatLon[], cum: number[], p: LatLon): { along: number; offset: number } {
  let best = Infinity, bestI = 0;
  // Kaba tarama: her 4. nokta, sonra yerel ince tarama
  for (let i = 0; i < coords.length; i += 4) {
    const d = quickDist(coords[i], p);
    if (d < best) { best = d; bestI = i; }
  }
  const from = Math.max(0, bestI - 6), to = Math.min(coords.length - 1, bestI + 6);
  for (let i = from; i <= to; i++) {
    const d = quickDist(coords[i], p);
    if (d < best) { best = d; bestI = i; }
  }
  return { along: cum[bestI], offset: haversine(coords[bestI], p) };
}
function quickDist(a: LatLon, b: LatLon) {
  const x = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180);
  const y = b[0] - a[0];
  return x * x + y * y;
}

const norm = (s: string) => s.toLocaleLowerCase('tr-TR')
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

export function findOperator(name: string, operators: Operator[]): Operator | null {
  const n = ' ' + norm(name).replace(/[^a-z0-9]+/g, ' ') + ' ';
  for (const op of operators) {
    for (const m of op.match) {
      const t = norm(m).replace(/[^a-z0-9]+/g, ' ').trim();
      if (t && n.includes(' ' + t + ' ')) return op;
    }
  }
  return null;
}

export function averageDc(operators: Operator[]): number {
  const v = operators.map((o) => o.dc).filter(Boolean);
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
}

export function priceFor(st: Station, operators: Operator[], avg: number): PriceInfo {
  const op = findOperator(`${st.operator} ${st.name}`, operators);
  if (op) return { price: op.dc, opName: op.name, opId: op.id, estimated: false };
  return { price: avg, opName: st.operator || 'Bilinmeyen operatör', opId: null, estimated: true };
}

/** Ortalama şarj gücü: araç ve istasyon gücünden küçüğü, şarj eğrisi için düzeltilmiş. */
export function avgPower(carDcMax: number, stationKw: number | null, targetSoc: number): number {
  const peak = Math.min(carDcMax, stationKw ?? Math.min(carDcMax, 120));
  const curve = targetSoc > 0.8 ? 0.55 : 0.68;
  return Math.max(20, peak * curve);
}

const CHARGE_EFF = 0.93; // şebekeden çekilen / bataryaya giren

export function plan(inp: PlanInput): PlanResult {
  const reserve = inp.reserve ?? 0.15;
  const targetMax = inp.targetSoc ?? 0.8;
  const { battery, consumption: cons, routeKm, operators } = inp;
  const avg = averageDc(operators);
  const stations = [...inp.stations].sort((a, b) => a.along - b.along);
  const stops: Stop[] = [];
  let pos = 0, soc = inp.startSoc;
  let guard = 0;

  const result = (ok: boolean, error?: string): PlanResult => {
    const arrivalSoc = soc - ((routeKm - pos) * cons) / battery;
    const totalEnergy = stops.reduce((a, s) => a + s.energyKwh, 0);
    const totalCost = stops.reduce((a, s) => a + s.cost, 0);
    const tripEnergy = routeKm * cons;
    return {
      ok, error, stops, arrivalSoc,
      totalEnergy, totalCost,
      chargeMinutes: stops.reduce((a, s) => a + s.minutes, 0),
      driveMinutes: inp.durationS / 60,
      tripEnergy,
      costPer100: (tripEnergy / CHARGE_EFF) * avg / routeKm * 100,
    };
  };

  while (guard++ < 30) {
    const rangeKm = ((soc - reserve) * battery) / cons;
    if (pos + rangeKm >= routeKm) return result(true);

    const reachable = stations.filter((s) => s.along > pos + 3 && s.along <= pos + rangeKm);
    let pool = reachable.filter((s) => s.dc === true);
    let uncertainDc = false;
    if (!pool.length) { pool = reachable.filter((s) => s.dc !== false); uncertainDc = pool.length > 0; }
    if (!pool.length) {
      return result(false, `Rotanın ${Math.round(pos)}. km'sinden sonra menziliniz içinde hızlı şarj istasyonu bulunamadı. Başlangıç şarjını artırmayı veya farklı bir rota denemeyi düşünün.`);
    }

    const priced = pool.map((s) => ({ s, p: priceFor(s, operators, avg) }));
    let chosen: { s: Station; p: PriceInfo };
    const farEdge = pos + rangeKm;
    if (inp.mode === 'fast') {
      // Menzilin son %35'lik diliminde en güçlü istasyon; yoksa en uzaktaki
      const late = priced.filter((x) => x.s.along >= pos + rangeKm * 0.65);
      const set = late.length ? late : priced;
      chosen = set.reduce((a, b) => {
        const pa = Math.min(a.s.powerKw ?? 60, inp.carDcMax), pb = Math.min(b.s.powerKw ?? 60, inp.carDcMax);
        if (pb !== pa) return pb > pa ? b : a;
        return b.s.along > a.s.along ? b : a;
      });
    } else {
      // Menzilin ikinci yarısında, bu durakta ödenecek tutar + kalan yol için
      // ortalama fiyattan tahmini enerji maliyeti en düşük olan istasyon
      const window = priced.filter((x) => x.s.along >= pos + rangeKm * 0.45);
      const set = window.length ? window : priced;
      const score = (x: { s: Station; p: PriceInfo }) => {
        const arr = soc - ((x.s.along - pos) * cons) / battery;
        const need = ((routeKm - x.s.along) * cons) / battery + reserve + 0.03;
        let dep = Math.min(targetMax, Math.ceil(need * 20) / 20);
        dep = Math.max(dep, Math.min(targetMax, arr + 0.15));
        const here = ((dep - arr) * battery / CHARGE_EFF) * (x.p.price + (x.p.estimated ? 0.75 : 0));
        // bu duraktan sonra hâlâ eksik kalan enerji, ortalama fiyattan
        const remainingNeed = Math.max(0, ((routeKm - x.s.along) * cons) / battery + reserve - dep);
        return here + (remainingNeed * battery / CHARGE_EFF) * avg;
      };
      chosen = set.reduce((a, b) => {
        const sa = score(a), sb = score(b);
        if (Math.abs(sb - sa) > 1) return sb < sa ? b : a;
        return b.s.along > a.s.along ? b : a;
      });
    }

    const st = chosen.s;
    const arrivalSoc = soc - ((st.along - pos) * cons) / battery;
    const needSoc = ((routeKm - st.along) * cons) / battery + reserve + 0.03;
    let departSoc = Math.min(targetMax, Math.ceil(needSoc * 20) / 20);
    departSoc = Math.max(departSoc, Math.min(targetMax, arrivalSoc + 0.15));
    const energyKwh = ((departSoc - arrivalSoc) * battery) / CHARGE_EFF;
    const powerUsed = avgPower(inp.carDcMax, st.powerKw, departSoc);
    const minutes = (((departSoc - arrivalSoc) * battery) / powerUsed) * 60 + 3;
    const cost = energyKwh * chosen.p.price;

    const alternatives: Alternative[] = priced
      .filter((x) => x.s.id !== st.id && Math.abs(x.s.along - st.along) <= 30 && !x.p.estimated)
      .map((x) => ({ station: x.s, price: x.p, cost: energyKwh * x.p.price, diffKm: x.s.along - st.along }))
      .sort((a, b) => a.cost - b.cost);
    const cheaper = alternatives.find((a) => a.cost < cost - 15 && a.price.opId !== chosen.p.opId) ?? null;
    // aynı operatörün tekrarlarını ayıkla
    const seen = new Set<string>([chosen.p.opName]);
    const altUnique = alternatives.filter((a) => (seen.has(a.price.opName) ? false : (seen.add(a.price.opName), true))).slice(0, 3);

    stops.push({ station: st, price: chosen.p, arrivalSoc, departSoc, energyKwh, minutes, cost, powerUsed, cheaper, alternatives: altUnique, uncertainDc });
    pos = st.along; soc = departSoc;
    if (farEdge <= pos) break;
  }
  return result(false, 'Rota hesaplanamadı.');
}

/** OSM etiketlerinden istasyon bilgisi çıkarır. */
export function parseOsm(el: any): Omit<Station, 'along' | 'offset'> | null {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;
  const keys = Object.keys(t);
  const dcSock = keys.some((k) => /^socket:(type2_combo|ccs|chademo|gb_dc|tesla_supercharger)/.test(k) && !/output|current|voltage/.test(k) && t[k] !== '0' && t[k] !== 'no');
  const acSock = keys.some((k) => /^socket:(type2|type2_cable|schuko|type1)$/.test(k) && t[k] !== '0');
  let power: number | null = null;
  for (const k of keys) {
    if (/output$/.test(k) || k === 'charging_station:output') {
      const m = String(t[k]).match(/([\d.,]+)\s*(kw|kva)?/i);
      if (m) {
        let v = parseFloat(m[1].replace(',', '.'));
        if (/w$/i.test(String(t[k])) && !/kw/i.test(String(t[k])) && v > 1000) v = v / 1000;
        if (v > 0 && v < 1000) power = Math.max(power ?? 0, v);
      }
    }
  }
  const operator = t.operator || t.brand || t.network || '';
  const name = t.name || operator || 'Şarj istasyonu';
  let dc: boolean | null = dcSock ? true : acSock ? false : null;
  if (dc === null && power != null) dc = power >= 40;
  if (dc === false && power != null && power >= 40) dc = true;
  if (/supercharger/i.test(name + operator)) { dc = true; power = power ?? 150; }
  return { id: `${el.type}/${el.id}`, lat, lon, name, operator, powerKw: power, dc };
}
