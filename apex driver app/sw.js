// Driver app service worker.
//
// Strategy:
//   - HTML pages and other static files: stale-while-revalidate (cache then
//     network refresh). Safe for offline use of the dashboard.
//   - /js/* files: network-first, no caching. The driver app's correctness
//     depends on the JS being the latest deployed version (e.g. the
//     oil-collections fix in commit 7a195055). Caching those files caused
//     the driver to keep running the silent-orphan-save fallback after the
//     fix was deployed, because the SW served the old cached JS even after
//     a successful collection save. Forcing network-first on /js/* makes
//     deploys take effect on the very next page load, no hard refresh
//     required.

const CACHE_NAME = 'apex-driver-v3';
const ASSETS = [
  '/',
  '/auth.html',
  '/main.html',
  '/dashboard.html',
  '/jobs.html',
  '/my-jobs.html',
  '/job-detail.html',
  '/map.html',
  '/profile.html',
  '/oil-collection.html',
  '/styles/global.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Use addAll with a filter so a single missing asset doesn't abort
      // the entire precache step.
      Promise.all(ASSETS.map(url => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete any older cache (apex-driver-v1, apex-driver-v2, ...)
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      self.clients.claim()
    ])
  );
});

// Allow the page to ask the waiting SW to take over immediately.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING' && self.waiting) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first, no caching, for any /js/* request. Deploys take effect
  // on the next page load without requiring the user to hard-refresh.
  if (url.pathname.startsWith('/js/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        // Last-resort fallback if the user is offline: serve whatever is
        // in the active cache, even if it is a stale version.
        caches.match(event.request)
      )
    );
    return;
  }

  // Stale-while-revalidate for everything else (HTML, CSS, manifest).
  // Page loads are fast and the offline shell still works when the network
  // is gone. The next online fetch refreshes the cache.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});