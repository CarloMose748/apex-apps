// Service worker for Apex Admin Panel
// Bump CACHE_NAME on every deploy so users get the new bundle.

const CACHE_NAME = 'apex-admin-v2';
const PRECACHE_URLS = ['/manifest.json'];

// HTML pages should NEVER be served from cache.
const NETWORK_ONLY_PATHS = ['/', '/index.html', '/auth.html', '/admin.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate' || NETWORK_ONLY_PATHS.includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Other assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              cache.put(event.request, clone);
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
