// Andy's Health – Service Worker (offline-Unterstützung)
const CACHE = 'andys-health-v9';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Nur eigene Dateien behandeln – KI-Anfragen gehen immer direkt ins Netz
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Seite: zuerst Netz (damit Updates sofort ankommen), offline aus dem Cache
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Rest: Cache zuerst
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
