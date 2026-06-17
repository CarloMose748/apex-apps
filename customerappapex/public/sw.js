// Service worker for Apex Customer App
// Bump CACHE_NAME on every deploy so users get the new bundle.

const CACHE_NAME = 'apex-customer-v2';
const PRECACHE_URLS = ['/manifest.json', '/logo-apex.png'];

// HTML pages should NEVER be served from cache — always go to the network.
// This ensures the latest index.html (with the new asset hashes) is loaded
// and the browser downloads the current JS bundle.
const NETWORK_ONLY_PATHS = ['/', '/index.html', '/register', '/login'];

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

  // HTML and navigation requests: network-first, no cache fallback.
  if (event.request.mode === 'navigate' || NETWORK_ONLY_PATHS.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Offline fallback if the user is truly offline.
        return new Response(
          '<!doctype html><html><body style="font-family:sans-serif;padding:40px;"><h2>Offline</h2><p>You appear to be offline. Please reconnect and try again.</p></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // All other assets (JS, CSS, images, fonts): stale-while-revalidate.
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
