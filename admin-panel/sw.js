const CACHE_NAME = 'apex-admin-v1';
const ASSETS = ['/', '/auth.html', '/admin.html', '/flowbins.html', '/global.css', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then((r) => {
      const c = r.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, c));
      return r;
    }).catch(() => caches.match(event.request))
  );
});
