// Konuma en yakın şarj istasyonları (Google Places API (New) — Nearby Search).
// GET /api/yakin?at=lat,lng  → { stations[] }   Konum saklanmaz.
// Koordinatlar istemcide ~100 m'ye yuvarlanır; yanıt CDN'de 5 dk önbellekte tutulur (anlık doluluk için kısa).
import type { Config, Context } from '@netlify/functions';
import { uidFrom, takeQuota } from '../../src/lib/server-quota';
import { NEAR_LIMITS, GUEST_IP_LIMIT } from '../../src/lib/firebase-config';

const NEARBY = 'https://places.googleapis.com/v1/places:searchNearby';
const DC_TYPES = new Set(['EV_CONNECTOR_TYPE_CCS_COMBO_2', 'EV_CONNECTOR_TYPE_CCS_COMBO_1', 'EV_CONNECTOR_TYPE_CHADEMO', 'EV_CONNECTOR_TYPE_TESLA', 'EV_CONNECTOR_TYPE_GB_T_DC', 'EV_CONNECTOR_TYPE_NACS']);
const LABEL: Record<string, string> = {
  EV_CONNECTOR_TYPE_CCS_COMBO_2: 'CCS2', EV_CONNECTOR_TYPE_CCS_COMBO_1: 'CCS1', EV_CONNECTOR_TYPE_CHADEMO: 'CHAdeMO',
  EV_CONNECTOR_TYPE_TYPE_2: 'Type 2', EV_CONNECTOR_TYPE_J1772: 'Type 1', EV_CONNECTOR_TYPE_TESLA: 'Tesla', EV_CONNECTOR_TYPE_NACS: 'NACS',
  EV_CONNECTOR_TYPE_GB_T_DC: 'GB/T DC', EV_CONNECTOR_TYPE_GB_T: 'GB/T', EV_CONNECTOR_TYPE_UNSPECIFIED_WALL_OUTLET: 'Priz', EV_CONNECTOR_TYPE_OTHER: 'Diğer',
};
const ALLOWED = /^https?:\/\/([a-z0-9-]+\.)*(evturkiye\.online|evturkiye\.com\.tr|netlify\.app)(:\d+)?$|^http:\/\/localhost(:\d+)?$/i;

const json = (body: unknown, status = 200, cache = false) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    ...(cache ? { 'Netlify-CDN-Cache-Control': 'public, s-maxage=300' } : {}),
  },
});

export default async (req: Request, ctx: Context) => {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return json({ error: 'Sunucu anahtarı tanımlı değil.' }, 503);
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  if (!(ALLOWED.test(origin) || (referer && ALLOWED.test(new URL(referer).origin)))) return json({ error: 'İzin verilmeyen kaynak.' }, 403);

  const at = (new URL(req.url).searchParams.get('at') || '').split(',').map(Number);
  if (at.length !== 2 || !at.every(Number.isFinite) || at[0] < 34 || at[0] > 43.5 || at[1] < 24 || at[1] > 46) {
    return json({ error: 'Bu hizmet şimdilik yalnızca Türkiye içinde çalışıyor.' }, 400);
  }

  // Günlük hak: üyeler hesap bazında 5, misafirler cihazda 2 (sunucuda IP başına geniş sınır)
  const spot = `${at[0].toFixed(2)},${at[1].toFixed(2)}`; // ~1 km: aynı bölgede tekrar arama hak düşürmez
  const uid = await uidFrom(req);
  if (!uid) return json({ error: 'Yakındaki şarj istasyonları aracı üyelerimize özeldir. Ücretsiz üye olun veya giriş yapın.', needLogin: true }, 401);
  try {
    const q = uid
      ? await takeQuota('yakin-kota', 'u/' + uid, spot, NEAR_LIMITS.member)
      : await takeQuota('yakin-kota', 'ip/' + (ctx.ip || 'x'), spot, GUEST_IP_LIMIT);
    if (!q.ok) {
      return json(uid
        ? { error: `Bugün için ${NEAR_LIMITS.member} arama hakkınızı kullandınız. Yarın tekrar arayabilirsiniz.`, limit: true }
        : { error: 'Bugünkü ücretsiz arama hakkı doldu. Devam etmek için ücretsiz üye olun.', limit: true, needLogin: true }, 429);
    }
  } catch (e: any) { console.error('kota', e?.message); }

  try {
    const res = await fetch(NEARBY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.shortFormattedAddress,places.evChargeOptions,places.currentOpeningHours.openNow,places.googleMapsUri',
      },
      body: JSON.stringify({
        includedTypes: ['electric_vehicle_charging_station'],
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: at[0], longitude: at[1] }, radius: 25000 } },
        languageCode: 'tr', regionCode: 'TR',
      }),
    });
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) { console.error('nearby', res.status, j?.error?.message); return json({ error: 'İstasyon servisine şu an ulaşılamıyor.' }, 502); }
    const stations = (j.places || []).map((p: any) => {
      const conns = (p.evChargeOptions?.connectorAggregation || []).map((c: any) => ({
        type: LABEL[c.type] || 'Diğer',
        dc: DC_TYPES.has(c.type) || Number(c.maxChargeRateKw) >= 40,
        kw: Number(c.maxChargeRateKw) || null,
        count: Number(c.count) || null,
        available: c.availableCount != null ? Number(c.availableCount) : null,
        outOfService: c.outOfServiceCount != null ? Number(c.outOfServiceCount) : null,
      }));
      return {
        id: p.id,
        name: p.displayName?.text || 'Şarj istasyonu',
        address: p.shortFormattedAddress || '',
        lat: p.location?.latitude, lon: p.location?.longitude,
        openNow: p.currentOpeningHours?.openNow ?? null,
        mapsUri: p.googleMapsUri || null,
        connectors: conns,
      };
    }).filter((s: any) => s.lat != null);
    return json({ stations }, 200, true);
  } catch (e: any) {
    console.error('yakin', e?.message);
    return json({ error: 'İstasyon servisine şu an ulaşılamıyor.' }, 502);
  }
};

export const config: Config = {
  path: '/api/yakin',
  method: 'GET',
  rateLimit: { windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
