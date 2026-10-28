// Rota + güzergâh üzerindeki DC şarj istasyonları (Google Routes API + Places API (New)).
// Anahtar yalnızca sunucuda durur: GOOGLE_MAPS_SERVER_KEY (Netlify ortam değişkeni).
// GET /api/rota?a=lat,lng&b=lat,lng  → { distanceM, durationS, polyline, stations[] }
// Aynı (yuvarlanmış) koordinatlar için yanıt Netlify CDN'inde 1 gün önbelleğe alınır.
import type { Config, Context } from '@netlify/functions';
import { uidFrom, takeQuota } from '../../src/lib/server-quota';
import { ROUTE_LIMITS, GUEST_IP_LIMIT } from '../../src/lib/firebase-config';

const ROUTES = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const PLACES = 'https://places.googleapis.com/v1/places:searchText';
const SEGMENT_KM = 140;
const MAX_SEGMENTS = 12;
const DC_TYPES = new Set(['EV_CONNECTOR_TYPE_CCS_COMBO_2', 'EV_CONNECTOR_TYPE_CCS_COMBO_1', 'EV_CONNECTOR_TYPE_CHADEMO', 'EV_CONNECTOR_TYPE_TESLA', 'EV_CONNECTOR_TYPE_GB_T_DC', 'EV_CONNECTOR_TYPE_NACS']);
const ALLOWED = /^https?:\/\/([a-z0-9-]+\.)*(evturkiye\.online|evturkiye\.com\.tr|netlify\.app)(:\d+)?$|^http:\/\/localhost(:\d+)?$/i;

type LL = [number, number];

const json = (body: unknown, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      ...(cache ? { 'Netlify-CDN-Cache-Control': 'public, s-maxage=86400, durable' } : {}),
    },
  });

function parseLL(v: string | null): LL | null {
  const m = (v || '').split(',').map(Number);
  if (m.length !== 2 || !m.every(Number.isFinite)) return null;
  const [lat, lng] = m;
  // Türkiye ve yakın çevresi
  if (lat < 34 || lat > 43.5 || lng < 24 || lng > 46) return null;
  return [lat, lng];
}

// --- Google encoded polyline
function decode(str: string): LL[] {
  const out: LL[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const k of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}
function encode(pts: LL[]): string {
  let out = '', pLat = 0, pLng = 0;
  const enc = (v: number) => {
    v = v < 0 ? ~(v << 1) : v << 1;
    let s = '';
    while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
    return s + String.fromCharCode(v + 63);
  };
  for (const [la, ln] of pts) {
    const a = Math.round(la * 1e5), b = Math.round(ln * 1e5);
    out += enc(a - pLat) + enc(b - pLng); pLat = a; pLng = b;
  }
  return out;
}
function hav(a: LL, b: LL) {
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
/** Rotayı ~SEGMENT_KM'lik, en fazla ~200 noktalık parçalara böler. */
function segments(pts: LL[]): string[] {
  const total = pts.reduce((s, p, i) => (i ? s + hav(pts[i - 1], p) : 0), 0);
  const segKm = Math.max(SEGMENT_KM, total / MAX_SEGMENTS);
  const segs: LL[][] = [];
  let cur: LL[] = [pts[0]], acc = 0;
  for (let i = 1; i < pts.length; i++) {
    acc += hav(pts[i - 1], pts[i]);
    cur.push(pts[i]);
    if (acc >= segKm) { segs.push(cur); cur = [pts[i]]; acc = 0; }
  }
  if (cur.length > 1) segs.push(cur);
  return segs.map((s) => {
    const step = Math.max(1, Math.ceil(s.length / 200));
    const thin = s.filter((_, i) => i % step === 0);
    if (thin[thin.length - 1] !== s[s.length - 1]) thin.push(s[s.length - 1]);
    return encode(thin);
  });
}

async function google(url: string, key: string, fieldMask: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${j?.error?.status || ''} ${j?.error?.message || ''}`.trim());
  return j;
}

function toStation(p: any) {
  const conns: any[] = p.evChargeOptions?.connectorAggregation || [];
  let dcKw = 0, acKw = 0, dcCount = 0;
  for (const c of conns) {
    const kw = Number(c.maxChargeRateKw) || 0;
    if (DC_TYPES.has(c.type) || kw >= 40) { dcKw = Math.max(dcKw, kw); dcCount += Number(c.count) || 1; }
    else acKw = Math.max(acKw, kw);
  }
  const name: string = p.displayName?.text || 'Şarj istasyonu';
  return {
    id: 'g/' + p.id,
    name,
    operator: name,
    lat: p.location?.latitude,
    lon: p.location?.longitude,
    dc: dcCount > 0 ? true : conns.length ? false : null,
    powerKw: dcKw || acKw || null,
    connectors: dcCount || undefined,
    address: p.shortFormattedAddress || undefined,
  };
}

export default async (req: Request, _ctx: Context) => {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return json({ error: 'Sunucu anahtarı tanımlı değil.' }, 503);

  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  const refOrigin = referer ? new URL(referer).origin : '';
  if (!(ALLOWED.test(origin) || ALLOWED.test(refOrigin))) return json({ error: 'İzin verilmeyen kaynak.' }, 403);

  const u = new URL(req.url);
  const a = parseLL(u.searchParams.get('a'));
  const b = parseLL(u.searchParams.get('b'));
  if (!a || !b) return json({ error: 'Geçersiz başlangıç veya varış noktası.' }, 400);

  // Günlük hak: üyeler hesap bazında, misafirler IP bazında (geniş) sınırlı
  const routeKey = `${a[0].toFixed(2)},${a[1].toFixed(2)}>${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  const uid = await uidFrom(req);
  if (!uid) return json({ error: 'Rota planlayıcı üyelerimize özeldir. Ücretsiz üye olun veya giriş yapın.', needLogin: true }, 401);
  const ip = _ctx.ip || req.headers.get('x-nf-client-connection-ip') || 'bilinmiyor';
  try {
    const q = uid ? await takeQuota('rota-kota', 'u/' + uid, routeKey, ROUTE_LIMITS.member) : await takeQuota('rota-kota', 'ip/' + ip, routeKey, GUEST_IP_LIMIT);
    if (!q.ok) {
      return json(uid
        ? { error: `Bugün için ${ROUTE_LIMITS.member} farklı rota hakkınızı kullandınız. Yarın yeni rota oluşturabilirsiniz.`, limit: true }
        : { error: 'Bugünkü ücretsiz rota hakkı doldu. Devam etmek için ücretsiz üye olun.', limit: true, needLogin: true }, 429);
    }
  } catch (e: any) { console.error('kota', e?.message); /* kota deposu çalışmazsa hizmeti engelleme */ }

  try {
    const r = await google(ROUTES, key, 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline', {
      origin: { location: { latLng: { latitude: a[0], longitude: a[1] } } },
      destination: { location: { latLng: { latitude: b[0], longitude: b[1] } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      languageCode: 'tr', regionCode: 'TR', units: 'METRIC',
    });
    const route = r.routes?.[0];
    if (!route) return json({ error: 'Bu iki nokta arasında karayolu rotası bulunamadı.' }, 404);
    const polyline: string = route.polyline.encodedPolyline;
    const pts = decode(polyline);

    // Güzergâhı parçalara bölüp her parçada DC şarj istasyonu ara
    const segs = segments(pts);
    const fields = 'places.id,places.displayName,places.location,places.shortFormattedAddress,places.evChargeOptions';
    const results = await Promise.allSettled(segs.map((enc) => google(PLACES, key, fields, {
      textQuery: 'elektrikli araç hızlı şarj istasyonu',
      includedType: 'electric_vehicle_charging_station',
      strictTypeFiltering: true,
      evOptions: { minimumChargingRateKw: 40 },
      searchAlongRouteParameters: { polyline: { encodedPolyline: enc } },
      maxResultCount: 20,
      languageCode: 'tr', regionCode: 'TR',
    })));
    const seen = new Set<string>();
    const stations = [];
    let failed = 0;
    let firstError = '';
    for (const res of results) {
      if (res.status !== 'fulfilled') { failed++; firstError ||= String(res.reason?.message || '').slice(0, 200); console.error('places', res.reason?.message); continue; }
      for (const p of res.value.places || []) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        const s = toStation(p);
        if (s.lat != null && s.lon != null) stations.push(s);
      }
    }
    return json({
      distanceM: route.distanceMeters,
      durationS: parseInt(String(route.duration || '0'), 10),
      polyline,
      stations,
      source: 'google',
      partial: failed > 0,
      ...(failed ? { placesError: firstError } : {}),
    }, 200, failed === 0);
  } catch (e: any) {
    console.error('rota', e?.message);
    return json({ error: 'Rota servisine şu an ulaşılamıyor. Biraz sonra tekrar deneyin.' }, 502);
  }
};

export const config: Config = {
  path: '/api/rota',
  method: 'GET',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
