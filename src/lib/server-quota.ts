// Netlify fonksiyonları için ortak üyelik doğrulama ve günlük hak sayacı.
import { getStore } from '@netlify/blobs';
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

/** Günlük farklı kayıt hakkı. Aynı anahtar tekrar gelirse hak düşmez. */
export async function takeQuota(bucket: string, who: string, itemKey: string, limit: number): Promise<{ ok: boolean; used: number }> {
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
  const store = getStore(bucket);
  const key = `${day}/${who}`;
  const list: string[] = ((await store.get(key, { type: 'json' })) as string[] | null) || [];
  if (list.includes(itemKey)) return { ok: true, used: list.length };
  if (list.length >= limit) return { ok: false, used: list.length };
  list.push(itemKey);
  await store.setJSON(key, list);
  return { ok: true, used: list.length };
}
