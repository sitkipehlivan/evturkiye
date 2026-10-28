// PUBLIC_FIREBASE_CONFIG: Firebase konsolundaki `{ apiKey: "...", authDomain: "...", ... }` bloğu.
// JSON ya da tırnaksız anahtarlı JS nesnesi olarak yapıştırılabilir; ikisini de okur.
export interface FirebaseConfig { apiKey: string; authDomain: string; projectId: string; appId: string; [k: string]: string; }

export function parseFirebaseConfig(raw: string | undefined | null): FirebaseConfig | null {
  if (!raw) return null;
  const out: Record<string, string> = {};
  const re = /["']?([A-Za-z]+)["']?\s*:\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) out[m[1]] = m[2];
  return out.apiKey && out.projectId && out.authDomain && out.appId ? (out as FirebaseConfig) : null;
}

/** Üye olmadan ve üye olarak günlük hak (rota planlayıcı ve yakındaki istasyonlar için ayrı ayrı) */
export const ROUTE_LIMITS = { guest: 2, member: 5 };
export const NEAR_LIMITS = { guest: 2, member: 5 };
/** Aynı IP'yi paylaşan misafirler (mobil operatör, ofis ağı) için sunucu tarafı üst sınır */
export const GUEST_IP_LIMIT = 10;
