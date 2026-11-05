// Netlify fonksiyonları için ortak üyelik doğrulama ve günlük hak sayacı.
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { parseFirebaseConfig } from './firebase-config';

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

/** Authorization: Bearer <Firebase ID token> → uid (geçersizse null) */
export async function uidFrom(req: Request): Promise<string | null> {
  const m = (req.headers.get('authorization') || '').match(/^Bearer (.+)$/);
  const cfg = parseFirebaseConfig(process.env.PUBLIC_FIREBASE_CONFIG);
  if (!m || !cfg) return null;
  try {
    const { payload } = await jwtVerify(m[1], JWKS, { issuer: `https://securetoken.google.com/${cfg.projectId}`, audience: cfg.projectId });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch { return null; }
}

/**
 * Günlük farklı kayıt hakkı. Aynı anahtar tekrar gelirse hak düşmez.
 * KVKK: kimlik (IP/üye no) gün bazlı tuzla tek yönlü özetlenir; ham IP saklanmaz. Kayıtlar yalnızca
 * bugün ve dün için tutulur, daha eskileri silinir (rota koordinatları kişiyle ilişkilendirilmeden kısa süre kalır).
 */
export async function takeQuota(bucket: string, who: string, itemKey: string, limit: number): Promise<{ ok: boolean; used: number }> {
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
  const store = getStore(bucket);
  const tuz = (process.env.QUOTA_SALT || process.env.PUBLIC_FIREBASE_CONFIG || 'evt') + '|' + day;
  const ozet = createHash('sha256').update(tuz + '|' + who).digest('hex').slice(0, 32);
  const key = `${day}/${ozet}`;
  const list: string[] = ((await store.get(key, { type: 'json' })) as string[] | null) || [];
  temizle(store, day, bucket).catch(() => {});
  if (list.includes(itemKey)) return { ok: true, used: list.length };
  if (list.length >= limit) return { ok: false, used: list.length };
  list.push(itemKey);
  await store.setJSON(key, list);
  return { ok: true, used: list.length };
}

// Bugün ve dün dışındaki tüm kayıtları siler (eski, ham IP içeren kayıtlar dahil). Her çağrıda değil, ara sıra çalışır.
const temizlendi = new Set<string>();
async function temizle(store: ReturnType<typeof getStore>, bugun: string, ad: string) {
  if (temizlendi.has(ad) && Math.random() > 0.05) return; // her soğuk başlangıçta bir kez, sonra ara sıra
  temizlendi.add(ad);
  const dun = new Date(Date.parse(bugun + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10);
  const { blobs } = await store.list();
  await Promise.all(blobs.filter((b) => !b.key.startsWith(bugun + '/') && !b.key.startsWith(dun + '/')).map((b) => store.delete(b.key)));
}
