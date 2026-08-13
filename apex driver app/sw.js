const CACHE_NAME = 'apex-driver-v2';
const ASSETS = ['/', '/auth.html', '/main.html', '/dashboard.html', '/jobs.html', '/my-jobs.html', '/job-detail.html', '/map.html', '/profile.html', '/profile.html', '/oil-collection.html', '/styles/global.css', '/manifest.json', '/js/apex-driver-service.js', '/js/oil-collection-service.js', '/js/auth-service.js', '/js/supabase-config.js'];

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
