// Üyelik penceresinin davranışı. openAuth() → kullanıcı giriş yaparsa User, kapatırsa null.
import type { User } from 'firebase/auth';
import { loginGoogle, loginEmail, registerEmail, resetPassword, authError, onUser } from './auth';

let pending: ((u: User | null) => void) | null = null;
let wired = false;

function wire(dlg: HTMLDialogElement) {
  if (wired) return;
  wired = true;
  const $ = <T extends Element>(s: string) => dlg.querySelector(s) as T;
  const msg = $<HTMLElement>('.auth-msg');
  const consentsBox = $<HTMLElement>('.auth-consents');
  const title = $<HTMLElement>('#auth-title');
  let tab: 'register' | 'login' = 'register';

  const show = (text: string, ok = false) => { msg.textContent = text; msg.hidden = !text; msg.classList.toggle('ok', ok); };
  const consents = () => ({
    kvkk: $<HTMLInputElement>('input[name="kvkk"]').checked,
    marketing: $<HTMLInputElement>('input[name="marketing"]').checked,
  });
  const needKvkk = () => {
    if (tab === 'register' && !consents().kvkk) { show('Devam etmek için aydınlatma metnini ve üyelik koşullarını onaylayın.'); return true; }
    return false;
  };
  const setTab = (t: 'register' | 'login') => {
    tab = t;
    dlg.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    dlg.querySelectorAll<HTMLFormElement>('[data-form]').forEach((f) => (f.hidden = f.dataset.form !== t));
    consentsBox.hidden = t !== 'register';
    title.textContent = t === 'register' ? 'Ücretsiz üye ol' : 'Giriş yap';
    show('');
  };
  dlg.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab as any)));

  const busy = async (fn: () => Promise<User | void>) => {
    dlg.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
    try {
      const u = await fn();
      if (u) done(u);
    } catch (e) { show(authError(e)); } finally {
      dlg.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = false));
    }
  };
  const done = (u: User) => { const p = pending; pending = null; dlg.close(); p?.(u); };

  $<HTMLButtonElement>('[data-google]').addEventListener('click', () => {
    if (needKvkk()) return;
    busy(() => loginGoogle(tab === 'register' ? consents() : undefined));
  });
  $<HTMLFormElement>('[data-form="register"]').addEventListener('submit', (e) => {
    e.preventDefault();
    if (needKvkk()) return;
    const f = new FormData(e.target as HTMLFormElement);
    busy(() => registerEmail(String(f.get('name')), String(f.get('email')), String(f.get('password')), consents()));
  });
  $<HTMLFormElement>('[data-form="login"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    busy(() => loginEmail(String(f.get('email')), String(f.get('password'))));
  });
  $<HTMLButtonElement>('[data-reset]').addEventListener('click', () => {
    const email = ($<HTMLInputElement>('[data-form="login"] input[name="email"]').value || '').trim();
    if (!email) { show('Şifre sıfırlama bağlantısı için önce e-posta adresinizi yazın.'); return; }
    busy(async () => { await resetPassword(email); show('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', true); });
  });
  dlg.addEventListener('close', () => { const p = pending; pending = null; p?.(null); });
  (dlg as any)._setTab = setTab;
}

export function openAuth(opts: { reason?: string; tab?: 'register' | 'login' } = {}): Promise<User | null> {
  const dlg = document.getElementById('evt-auth') as HTMLDialogElement | null;
  if (!dlg) return Promise.resolve(null);
  wire(dlg);
  (dlg as any)._setTab(opts.tab || 'register');
  const r = dlg.querySelector<HTMLElement>('.auth-reason')!;
  r.textContent = opts.reason || '';
  r.hidden = !opts.reason;
  return new Promise((resolve) => {
    pending = resolve;
    dlg.showModal();
  });
}

export { onUser };
