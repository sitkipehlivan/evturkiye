/* EV Türkiye service worker: sayfalar önce ağdan, statik dosyalar önbellekten; internet yoksa çevrimdışı sayfası. */
const V = '2026-11-14-1';
const SHELL = 'evt-shell-' + V, PAGES = 'evt-pages', IMGS = 'evt-imgs';
const PRECACHE = ['/offline/', '/app/icon-192.png', '/favicon.svg', '/site.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('evt-shell-') && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function put(name, req, res, max) {
  if (!res || !res.ok || res.type === 'opaqueredirect') return;
  const c = await caches.open(name);
  await c.put(req, res);
  if (max) { const ks = await c.keys(); for (let i = 0; i < ks.length - max; i++) await c.delete(ks[i]); }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // harita, reklam, analiz, Firebase: dokunma
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname === '/sw.js') return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        put(PAGES, new Request(url.origin + url.pathname), res.clone(), 60);
        return res;
      } catch {
        return (await caches.match(url.origin + url.pathname)) || (await caches.match('/offline/'));
      }
    })());
    return;
  }
  if (url.pathname.startsWith('/_astro/')) { // adı içeriğe göre değişen dosyalar: önbellekten
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { put(SHELL, req, res.clone()); return res; })));
    return;
  }
  if (url.pathname.startsWith('/images/')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { put(IMGS, req, res.clone(), 200); return res; }).catch(() => new Response('', { status: 504 }))));
  }
});

// ---------- bildirimler (web push) ----------
const pushOlay = (e, id) => id ? fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'olay', e, id }) }).catch(() => {}) : Promise.resolve();
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  const secenek = { body: d.b || '', icon: d.i || '/app/icon-192.png', badge: '/app/icon-192.png', data: { u: d.u || '/', id: d.id || '' } };
  if (d.g) secenek.image = d.g;
  if (d.id) secenek.tag = d.id;
  e.waitUntil(Promise.all([self.registration.showNotification(d.t || 'EV Türkiye', secenek), pushOlay('g', d.id)]));
});
self.addEventListener('notificationclick', (e) => {
  const d = e.notification.data || {};
  e.notification.close();
  e.waitUntil(Promise.all([pushOlay('c', d.id), self.clients.openWindow(d.u || '/')]));
});
// Tarayıcı aboneliği yenilerse yeni adresi kaydet, eskisini sil
self.addEventListener('pushsubscriptionchange', (e) => {
  const eski = e.oldSubscription;
  if (!eski || !eski.options) return;
  e.waitUntil(self.registration.pushManager.subscribe(eski.options).then((yeni) => Promise.all([
    fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'abone', sub: yeni.toJSON() }) }),
    fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'iptal', endpoint: eski.endpoint }) }),
  ])).catch(() => {}));
});
