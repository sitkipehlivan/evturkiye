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

/** Üye olmadan ve üye olarak günlük farklı rota hakkı */
export const ROUTE_LIMITS = { guest: 2, member: 5 };
