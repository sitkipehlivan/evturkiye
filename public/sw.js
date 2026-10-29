/* EV Türkiye service worker: sayfalar önce ağdan, statik dosyalar önbellekten; internet yoksa çevrimdışı sayfası. */
const V = '2026-10-29-1';
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
