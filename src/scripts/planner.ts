import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  plan, cumulative, locate,
  type LatLon, type Operator, type Station, type PlanResult,
} from './planner-core';
import { stationsInBoxes, loadStatic, type Box } from './stations';
import { loadGoogle, GoogleAutocomplete, GoogleMapView, decodePolyline, type Pin } from './google';
import { authEnabled, onUser, currentUser, idToken } from './auth';
import { openAuth } from './auth-ui';
import { ROUTE_LIMITS } from '../lib/firebase-config';

interface Model { slug: string; brand: string; model: string; version: string; battery: number; wltp: number; dcMax: number; highway: number; }
interface Place { label: string; lat: number; lon: number; }

const PHOTON = 'https://photon.komoot.io/api/';
const OSRM = 'https://router.project-osrm.org/route/v1/driving/';
const TR_BBOX = '25.6,35.8,44.9,42.2';

const root = document.querySelector<HTMLElement>('[data-planner]');
if (root) { loadStatic(); init(root); }

function init(root: HTMLElement) {
  const data = JSON.parse(root.querySelector('script[type="application/json"]')!.textContent || '{}');
  const models: Model[] = data.models;
  const operators: Operator[] = data.operators;
  const $ = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;

  const form = $<HTMLFormElement>('form');
  const fromIn = $<HTMLInputElement>('#pl-from');
  const toIn = $<HTMLInputElement>('#pl-to');
  const carSel = $<HTMLSelectElement>('#pl-car');
  const socIn = $<HTMLInputElement>('#pl-soc');
  const socOut = $<HTMLElement>('#pl-soc-out');
  const seasonSel = $<HTMLSelectElement>('#pl-season');
  const speedSel = $<HTMLSelectElement>('#pl-speed');
  const btn = $<HTMLButtonElement>('#pl-submit');
  const status = $<HTMLElement>('.pl-status');
  const results = $<HTMLElement>('.pl-results');
  const mapEl = $<HTMLElement>('.pl-map');

  const places: Record<string, Place | null> = { from: null, to: null };
  // Oturum durumu (üyelik açıksa): ilk yanıt gelene kadar bekle
  const userReady: Promise<void> = new Promise((res) => { const off = onUser(() => { res(); }); void off; });

  // --- Harita: Google anahtarı varsa Google Haritalar, yoksa OpenStreetMap (Leaflet)
  const gmKey: string = data.gmKey || '';
  let useGoogle = !!gmKey;
  let gview: GoogleMapView | null = null;
  const gac = new GoogleAutocomplete();
  let map: L.Map | null = null;
  let layer: L.LayerGroup | null = null;
  const leaflet = () => {
    if (map) return;
    map = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false }).setView([39.2, 33.5], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19, className: 'osm-tiles',
    }).addTo(map);
    map.on('click', () => map!.scrollWheelZoom.enable());
    layer = L.layerGroup().addTo(map);
  };
  const ready: Promise<void> = useGoogle
    ? loadGoogle(gmKey)
        .then(async () => { gview = await GoogleMapView.create(mapEl, data.gmMapId || 'DEMO_MAP_ID'); })
        .catch(() => { useGoogle = false; mapEl.innerHTML = ''; leaflet(); })
    : Promise.resolve(leaflet());

  // --- Başlangıç değerleri (URL veya data)
  const qs = new URLSearchParams(location.search);
  const pre = data.preset || {};
  const setPlace = (key: 'from' | 'to', input: HTMLInputElement, label?: string, lat?: number, lon?: number) => {
    if (label) input.value = label;
    if (label && lat != null && lon != null && !Number.isNaN(lat)) places[key] = { label, lat, lon };
  };
  setPlace('from', fromIn, qs.get('from') || pre.fromQ, num(qs.get('fl')) ?? pre.a?.[0], num(qs.get('fo')) ?? pre.a?.[1]);
  setPlace('to', toIn, qs.get('to') || pre.toQ, num(qs.get('tl')) ?? pre.b?.[0], num(qs.get('to_o')) ?? pre.b?.[1]);
  if (qs.get('car') && models.some((m) => m.slug === qs.get('car'))) carSel.value = qs.get('car')!;
  else { try { const c = localStorage.getItem('evt-car'); if (c && models.some((m) => m.slug === c)) carSel.value = c; } catch { /* yoksay */ } }
  if (qs.get('soc')) socIn.value = qs.get('soc')!;
  if (qs.get('mode') === 'eco') (root.querySelector('input[value="eco"]') as HTMLInputElement).checked = true;
  socOut.textContent = `%${socIn.value}`;
  socIn.addEventListener('input', () => (socOut.textContent = `%${socIn.value}`));

  // --- Adres otomatik tamamlama
  autocomplete(fromIn, 'from');
  autocomplete(toIn, 'to');
  function autocomplete(input: HTMLInputElement, key: 'from' | 'to') {
    const list = document.createElement('ul');
    list.className = 'pl-suggest';
    list.hidden = true;
    input.parentElement!.appendChild(list);
    let timer: number | undefined, ctrl: AbortController | undefined;
    input.addEventListener('input', () => {
      places[key] = null;
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 3) { list.hidden = true; return; }
      timer = window.setTimeout(async () => {
        ctrl?.abort(); ctrl = new AbortController();
        try {
          await ready;
          const res: { label: string; resolve: () => Promise<Place> }[] = useGoogle
            ? await gac.suggest(q)
            : (await geocode(q, 6, ctrl.signal)).map((p) => ({ label: p.label, resolve: async () => p }));
          if (input.value.trim() !== q) return;
          list.innerHTML = '';
          res.forEach((p) => {
            const li = document.createElement('li');
            li.textContent = p.label;
            li.addEventListener('mousedown', async (e) => {
              e.preventDefault();
              input.value = p.label; list.hidden = true;
              try { places[key] = await p.resolve(); } catch { places[key] = null; }
            });
            list.appendChild(li);
          });
          list.hidden = !res.length;
        } catch { /* yoksay */ }
      }, 280);
    });
    input.addEventListener('blur', () => setTimeout(() => (list.hidden = true), 150));
  }

  // --- Hesaplama
  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  if (data.autorun || (qs.get('from') && qs.get('to'))) run();

  async function run() {
    const car = models.find((m) => m.slug === carSel.value)!;
    const startSoc = Number(socIn.value) / 100;
    const mode = ((root.querySelector('input[name="mode"]:checked') as HTMLInputElement)?.value || 'fast') as 'fast' | 'eco';
    const factor = Number(seasonSel.value) * Number(speedSel.value);
    btn.disabled = true;
    results.innerHTML = '';
    try {
      setStatus('Adresler bulunuyor…');
      await ready;
      const find = async (q: string) => (useGoogle ? await gac.first(q).catch(() => null) : null) ?? (await geocode(q, 1))[0];
      const a = places.from ?? (await find(fromIn.value));
      const b = places.to ?? (await find(toIn.value));
      if (!a || !b) throw new Error('Başlangıç veya varış noktası bulunamadı. Lütfen listeden bir adres seçin.');
      places.from = a; places.to = b;
      const quotaKey = `${a.lat.toFixed(2)},${a.lon.toFixed(2)}>${b.lat.toFixed(2)},${b.lon.toFixed(2)}`;
      const members = authEnabled();
      if (members) await userReady;
      const member = members && !!currentUser();
      if (!data.preset && !member && !quota.allowed(quotaKey, members ? ROUTE_LIMITS.guest : quota.LIMIT)) {
        if (members) {
          setStatus('');
          const u = await openAuth({ reason: `Üye olmadan günde ${ROUTE_LIMITS.guest} farklı rota hesaplayabilirsiniz. Ücretsiz üye olarak günde ${ROUTE_LIMITS.member} rotaya kadar devam edin.` });
          if (!u) throw new Error(`Bugünkü ${ROUTE_LIMITS.guest} ücretsiz rota hakkınızı kullandınız. Devam etmek için ücretsiz üye olun veya giriş yapın.`);
          setStatus('Rota ve güzergâhtaki şarj istasyonları hesaplanıyor…');
        } else {
          throw new Error(`Bugün için ${quota.LIMIT} farklı rota hakkınızı kullandınız. Daha önce hesapladığınız rotaları tekrar görüntüleyebilir, yarın yeni rota oluşturabilirsiniz.`);
        }
      }

      setStatus('Rota ve güzergâhtaki şarj istasyonları hesaplanıyor…');
      let route: { coords: LatLon[]; duration: number } | null = null;
      let gStations: any[] = [];
      if (useGoogle) {
        try {
          const g = await googleRoute(a, b);
          route = { coords: decodePolyline(g.polyline), duration: g.durationS };
          gStations = g.stations || [];
        } catch (err: any) {
          if (err?.limit) throw err;
          route = null;
        }
      }
      route ??= await getRoute(a, b);
      const cum = cumulative(route.coords);
      const routeKm = cum[cum.length - 1];

      if (!gStations.length) setStatus('Güzergahtaki şarj istasyonları taranıyor…');
      const stations = mergeStations(route.coords, cum, gStations, await getStations(route.coords, cum));

      const consumption = (car.highway * factor) / 100;
      const r = plan({ routeKm, durationS: route.duration, battery: car.battery, consumption, carDcMax: car.dcMax, startSoc, mode, stations, operators });
      setStatus('');
      draw(route.coords, a, b, stations, r);
      render(r, { a, b, car, routeKm, stations, startSoc, consumption, mode });
      updateUrl(a, b, car.slug, Math.round(startSoc * 100), mode);
      if (!data.preset) quota.add(quotaKey);
    } catch (err: any) {
      setStatus(err?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.', true);
    } finally {
      btn.disabled = false;
    }
  }

  function setStatus(msg: string, error = false) {
    status.textContent = msg;
    status.hidden = !msg;
    status.classList.toggle('error', error);
  }

  function updateUrl(a: Place, b: Place, car: string, soc: number, mode: string) {
    if (data.preset) return; // rota sayfalarında URL'yi değiştirme
    const p = new URLSearchParams({ from: a.label, fl: a.lat.toFixed(5), fo: a.lon.toFixed(5), to: b.label, tl: b.lat.toFixed(5), to_o: b.lon.toFixed(5), car, soc: String(soc), mode });
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }

  // --- Harita çizimi
  function draw(coords: LatLon[], a: Place, b: Place, stations: Station[], r: PlanResult) {
    if (gview) {
      const stopIds = new Set(r.stops.map((s) => s.station.id));
      const pins: Pin[] = [
        ...stations.filter((s) => !stopIds.has(s.id) && s.dc !== false).map((s) => ({ lat: s.lat, lon: s.lon, kind: 'station' as const, html: `<b>${esc(s.name)}</b><br>${s.powerKw ? `${s.powerKw} kW` : ''}` })),
        { lat: a.lat, lon: a.lon, kind: 'start', label: 'A', html: esc(a.label) },
        { lat: b.lat, lon: b.lon, kind: 'end', label: 'B', html: esc(b.label) },
        ...r.stops.map((s, i) => ({ lat: s.station.lat, lon: s.station.lon, kind: 'stop' as const, label: String(i + 1), html: `<b>${i + 1}. durak: ${esc(s.station.name)}</b><br>${esc(s.price.opName)} · ${tl(s.price.price)}/kWh` })),
      ];
      gview.draw(coords, pins);
      return;
    }
    if (!map || !layer) return;
    layer.clearLayers();
    L.polyline(coords, { color: '#ffffff', weight: 9, opacity: 1 }).addTo(layer);
    const line = L.polyline(coords, { color: '#0a7cff', weight: 5, opacity: .9 }).addTo(layer);
    const stopIds = new Set(r.stops.map((s) => s.station.id));
    stations.filter((s) => !stopIds.has(s.id) && s.dc !== false).forEach((s) => {
      L.circleMarker([s.lat, s.lon], { radius: 4, color: '#0a7cff', weight: 1.5, fillColor: '#fff', fillOpacity: 1 })
        .bindPopup(`<b>${esc(s.name)}</b><br>${esc(s.operator || '')}${s.powerKw ? ` · ${s.powerKw} kW` : ''}`)
        .addTo(layer);
    });
    const pin = (lat: number, lon: number, cls: string, html: string) =>
      L.marker([lat, lon], { icon: L.divIcon({ className: '', html: `<div class="pl-pin ${cls}">${html}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }) });
    pin(a.lat, a.lon, 'start', 'A').bindPopup(esc(a.label)).addTo(layer);
    pin(b.lat, b.lon, 'end', 'B').bindPopup(esc(b.label)).addTo(layer);
    r.stops.forEach((s, i) => pin(s.station.lat, s.station.lon, 'stop', String(i + 1))
      .bindPopup(`<b>${i + 1}. durak: ${esc(s.station.name)}</b><br>${esc(s.price.opName)} · ${tl(s.price.price)}/kWh`).addTo(layer));
    map.fitBounds(line.getBounds(), { padding: [30, 30] });
  }

  // --- Sonuç kartları
  function render(r: PlanResult, ctx: { a: Place; b: Place; car: Model; routeKm: number; stations: Station[]; startSoc: number; consumption: number; mode: string }) {
    const dcCount = ctx.stations.filter((s) => s.dc === true).length;
    const totalMin = r.driveMinutes + r.chargeMinutes;
    const summary = `
      <div class="pl-summary">
        <div><span>Mesafe</span><b>${Math.round(ctx.routeKm)} km</b></div>
        <div><span>Toplam süre</span><b>${dur(totalMin)}</b><em>${dur(r.driveMinutes)} sürüş + ${dur(r.chargeMinutes)} şarj</em></div>
        <div><span>Şarj durağı</span><b>${r.stops.length}</b><em>${dcCount} hızlı şarj noktası bulundu</em></div>
        <div class="hl"><span>Yol şarj maliyeti</span><b>${tl(r.totalCost)}</b><em>${r.totalEnergy.toFixed(0)} kWh</em></div>
      </div>
      <div class="pl-info">
        <span>Tüm yolun enerji karşılığı: <b>~${r.tripEnergy.toFixed(0)} kWh</b> (100 km'de ~${tl(r.costPer100)} hızlı şarj fiyatıyla)</span>
        <span>Varışta tahmini şarj: <b class="${r.arrivalSoc < 0.12 ? 'warn' : 'ok'}">%${Math.max(0, Math.round(r.arrivalSoc * 100))}</b></span>
      </div>`;

    let body = '';
    if (!r.ok) body += `<div class="pl-alert">${esc(r.error || '')}</div>`;
    if (r.ok && !r.stops.length) {
      body += `<div class="pl-alert ok">Bu yolculuk için yolda şarj durağına ihtiyacınız yok. %${Math.round(ctx.startSoc * 100)} ile çıkıp varışa yaklaşık %${Math.round(r.arrivalSoc * 100)} ile ulaşırsınız.</div>`;
    }
    body += '<ol class="pl-stops">';
    r.stops.forEach((s, i) => {
      const alts = s.alternatives.map((a) => `<li><span>${esc(a.price.opName)}</span><span>${a.diffKm >= 0 ? '+' : ''}${Math.round(a.diffKm)} km</span><span>${tl(a.price.price)}/kWh</span><b>${tl(a.cost)}</b></li>`).join('');
      body += `
      <li class="pl-stop">
        <div class="pl-stop-head">
          <span class="pl-num">${i + 1}</span>
          <div>
            <h4>${esc(s.station.name)}</h4>
            <p>${Math.round(s.station.along)}. km · ${esc(s.price.opName)}${s.station.powerKw ? ` · ${s.station.powerKw} kW DC` : ' · DC'}${s.station.offset > 0.8 ? ` · rotadan ${s.station.offset.toFixed(1)} km` : ''}</p>
          </div>
          <a class="pl-nav" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${s.station.lat},${s.station.lon}">Yol tarifi</a>
        </div>
        <div class="pl-stop-grid">
          <div><span>Şarj</span><b>%${Math.round(s.arrivalSoc * 100)} → %${Math.round(s.departSoc * 100)}</b></div>
          <div><span>Süre</span><b>~${Math.round(s.minutes)} dk</b></div>
          <div><span>Enerji</span><b>${s.energyKwh.toFixed(1)} kWh</b></div>
          <div><span>Tutar</span><b>${tl(s.cost)}</b><em>${tl(s.price.price)}/kWh${s.price.estimated ? ' (ort.)' : ''}</em></div>
        </div>
        ${s.price.estimated ? `<p class="pl-note">Bu operatörün fiyatı listemizde yok; ortalama DC fiyatıyla hesaplandı.</p>` : ''}
        ${s.uncertainDc ? `<p class="pl-note">Bu noktada DC soket bilgisi teyit edilemedi. Yola çıkmadan operatör uygulamasından kontrol edin.</p>` : ''}
        ${s.cheaper ? `<p class="pl-tip">💡 ${Math.abs(Math.round(s.cheaper.diffKm))} km ${s.cheaper.diffKm >= 0 ? 'ileride' : 'geride'} <b>${esc(s.cheaper.price.opName)}</b> istasyonunu kullanarak bu durakta <b>${tl(s.cost - s.cheaper.cost)}</b> tasarruf edebilirsiniz.</p>` : ''}
        ${alts ? `<details><summary>Yakındaki alternatifler</summary><ul class="pl-alts">${alts}</ul></details>` : ''}
      </li>`;
    });
    body += '</ol>';
    const foot = `<p class="pl-disclaimer">${esc(ctx.car.brand)} ${esc(ctx.car.model)} ${esc(ctx.car.version)} için 100 km'de ~${(ctx.consumption * 100).toFixed(1)} kWh otoyol tüketimi, %15 güvenlik rezervi ve %80 hedef şarj ile hesaplanmıştır. Hesaplama tahminidir; hız, hava, yük ve eğim tüketimi değiştirir. İstasyon verisi ${useGoogle ? 'Google ve ' : ''}OpenStreetMap katkıcılarındandır.</p>`;
    results.innerHTML = summary + body + foot;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- Servisler
  async function geocode(q: string, limit = 5, signal?: AbortSignal): Promise<Place[]> {
    const url = `${PHOTON}?q=${encodeURIComponent(q)}&limit=${limit}&bbox=${TR_BBOX}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error('Adres servisine ulaşılamadı.');
    const j = await res.json();
    return (j.features || []).map((f: any) => {
      const p = f.properties;
      const parts = [p.name, p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street, p.district, p.city || p.county, p.state]
        .filter(Boolean).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);
      return { label: parts.slice(0, 4).join(', '), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
    });
  }

  async function getRoute(a: Place, b: Place): Promise<{ coords: LatLon[]; duration: number }> {
    const res = await fetch(`${OSRM}${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`);
    if (!res.ok) throw new Error('Rota servisine şu an ulaşılamıyor. Biraz sonra tekrar deneyin.');
    const j = await res.json();
    if (!j.routes?.length) throw new Error('Bu iki nokta arasında karayolu rotası bulunamadı.');
    const r = j.routes[0];
    return { coords: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLon), duration: r.duration };
  }

  async function googleRoute(a: Place, b: Place, retried = false): Promise<{ polyline: string; durationS: number; stations: any[] }> {
    const token = authEnabled() ? await idToken().catch(() => null) : null;
    const res = await fetch(`/api/rota?a=${a.lat.toFixed(4)},${a.lon.toFixed(4)}&b=${b.lat.toFixed(4)},${b.lon.toFixed(4)}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    const j = await res.json().catch(() => ({}));
    if (res.status === 429 && j.needLogin && authEnabled() && !retried) {
      const u = await openAuth({ reason: j.error });
      if (u) return googleRoute(a, b, true);
    }
    if (res.status === 429) throw Object.assign(new Error(j.error || 'Günlük rota hakkı doldu.'), { limit: true });
    if (!res.ok || !j.polyline) throw new Error(j.error || 'Google rota servisi yanıt vermedi.');
    return j;
  }

  /** Google ve OSM istasyonlarını birleştirir; 150 m içindeki kopyalarda Google kaydı kalır. */
  function mergeStations(coords: LatLon[], cum: number[], g: any[], osm: Station[]): Station[] {
    const out: Station[] = [];
    for (const s of g) {
      const loc = locate(coords, cum, [s.lat, s.lon]);
      if (loc.offset <= 3) out.push({ id: s.id, lat: s.lat, lon: s.lon, name: s.name, operator: s.operator || s.name, powerKw: s.powerKw ?? null, dc: s.dc ?? null, ...loc });
    }
    const near = (x: Station, y: Station) => Math.abs(x.lat - y.lat) < 0.0014 && Math.abs(x.lon - y.lon) < 0.0018;
    for (const s of osm) if (!out.some((o) => near(o, s))) out.push(s);
    return out;
  }

  async function getStations(coords: LatLon[], cum: number[]): Promise<Station[]> {
    // Rotayı ~120 km'lik parçalara bölüp her parça için küçük bir kutu oluştur
    const boxes: Box[] = [];
    const PAD = 0.035;
    let startI = 0;
    for (let i = 1; i < coords.length; i++) {
      if (cum[i] - cum[startI] >= 120 || i === coords.length - 1) {
        let s = 90, w = 180, n = -90, e = -180;
        for (let j = startI; j <= i; j++) { s = Math.min(s, coords[j][0]); n = Math.max(n, coords[j][0]); w = Math.min(w, coords[j][1]); e = Math.max(e, coords[j][1]); }
        boxes.push([s - PAD, w - PAD, n + PAD, e + PAD]);
        startI = i;
      }
    }
    const out: Station[] = [];
    for (const s of await stationsInBoxes(boxes)) {
      const loc = locate(coords, cum, [s.lat, s.lon]);
      if (loc.offset <= 3) out.push({ ...s, ...loc });
    }
    return out;
  }
}

/** Kullanıcı başına günlük farklı rota sınırı (tarayıcıda tutulur). Aynı rota tekrar hesaplanırsa hak düşmez. */
const quota = {
  LIMIT: 5,
  KEY: 'evt-rota-hakki',
  read(): { day: string; keys: string[] } {
    const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
    try {
      const v = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (v && v.day === day && Array.isArray(v.keys)) return v;
    } catch { /* depolama kapalı */ }
    return { day, keys: [] };
  },
  allowed(k: string, limit = this.LIMIT) { const v = this.read(); return v.keys.includes(k) || v.keys.length < limit; },
  add(k: string) {
    const v = this.read();
    if (!v.keys.includes(k)) v.keys.push(k);
    try { localStorage.setItem(this.KEY, JSON.stringify(v)); } catch { /* yoksay */ }
  },
};

function num(v: string | null) { if (v == null) return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; }
function tl(v: number) { return '₺' + v.toLocaleString('tr-TR', { minimumFractionDigits: v < 100 ? 2 : 0, maximumFractionDigits: v < 100 ? 2 : 0 }); }
function dur(min: number) { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} sa ${m} dk` : `${m} dk`; }
function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
