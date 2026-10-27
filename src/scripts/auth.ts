// Firebase üyelik: Google veya e-posta/şifre ile giriş, Firestore'da üye profili (users/{uid}).
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, updateProfile, signOut, deleteUser,
  type Auth, type User,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp, type Firestore } from 'firebase/firestore/lite';
import { parseFirebaseConfig } from '../lib/firebase-config';

export interface Consents { kvkk: boolean; marketing: boolean; }
export interface Profile { name?: string; email?: string; car?: string; consents?: Consents & { updatedAt?: unknown }; createdAt?: unknown; }

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function authEnabled() { return !!readConfig(); }

function readConfig() {
  const el = document.querySelector<HTMLMetaElement>('meta[name="evt-fb"]');
  return parseFirebaseConfig(el?.content ? atob(el.content) : null);
}

function init() {
  if (auth) return { auth, db: db! };
  const cfg = readConfig();
  if (!cfg) throw new Error('Üyelik sistemi henüz etkin değil.');
  app = initializeApp(cfg);
  auth = getAuth(app);
  auth.languageCode = 'tr';
  db = getFirestore(app);
  return { auth, db };
}

/** Oturum durumu hazır olunca (ve her değiştiğinde) çağrılır. */
export function onUser(cb: (u: User | null) => void) {
  if (!authEnabled()) { cb(null); return () => {}; }
  return onAuthStateChanged(init().auth, cb);
}

export function currentUser(): User | null { return auth?.currentUser ?? null; }

export async function idToken(): Promise<string | null> {
  const u = currentUser();
  return u ? u.getIdToken() : null;
}

export async function loginGoogle(consents?: Consents) {
  const { auth } = init();
  const res = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureProfile(res.user, consents);
  return res.user;
}

export async function loginEmail(email: string, password: string) {
  const res = await signInWithEmailAndPassword(init().auth, email, password);
  await ensureProfile(res.user);
  return res.user;
}

export async function registerEmail(name: string, email: string, password: string, consents: Consents) {
  const res = await createUserWithEmailAndPassword(init().auth, email, password);
  if (name) await updateProfile(res.user, { displayName: name });
  await ensureProfile(res.user, consents, name);
  sendEmailVerification(res.user).catch(() => {});
  return res.user;
}

export function resetPassword(email: string) { return sendPasswordResetEmail(init().auth, email); }
export function logout() { return signOut(init().auth); }

export async function getProfile(u: User): Promise<Profile> {
  const snap = await getDoc(doc(init().db, 'users', u.uid));
  return (snap.exists() ? snap.data() : {}) as Profile;
}

export async function saveProfile(u: User, data: Partial<Profile>) {
  const patch: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.consents) patch.consents = { ...data.consents, updatedAt: serverTimestamp() };
  await setDoc(doc(init().db, 'users', u.uid), patch, { merge: true });
}

/** İlk girişte profil belgesini oluşturur; onaylar verildiyse kaydeder. */
async function ensureProfile(u: User, consents?: Consents, name?: string) {
  try {
    const { db } = init();
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base: Record<string, unknown> = { email: u.email, name: name || u.displayName || '', updatedAt: serverTimestamp() };
    if (!snap.exists()) base.createdAt = serverTimestamp();
    if (consents) base.consents = { ...consents, updatedAt: serverTimestamp() };
    await setDoc(ref, base, { merge: true });
  } catch (e) { console.warn('profil kaydedilemedi', e); }
}

export async function deleteAccount() {
  const u = currentUser();
  if (!u) return;
  await deleteDoc(doc(init().db, 'users', u.uid)).catch(() => {});
  await deleteUser(u);
}

/** Firebase hata kodlarını Türkçe mesaja çevirir. */
export function authError(e: any): string {
  const c = String(e?.code || '');
  const map: Record<string, string> = {
    'auth/invalid-email': 'E-posta adresi geçersiz.',
    'auth/missing-password': 'Şifre girin.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
    'auth/email-already-in-use': 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/wrong-password': 'E-posta veya şifre hatalı.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.',
    'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
    'auth/popup-blocked': 'Tarayıcı giriş penceresini engelledi. Açılır pencerelere izin verin.',
    'auth/network-request-failed': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
    'auth/requires-recent-login': 'Bu işlem için yeniden giriş yapmanız gerekiyor.',
    'auth/unauthorized-domain': 'Bu alan adı Firebase\'de yetkilendirilmemiş.',
  };
  return map[c] || e?.message || 'Bir hata oluştu.';
}
