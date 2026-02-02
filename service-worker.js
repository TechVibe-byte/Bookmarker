const CACHE_NAME = 'bookmarker-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg'
];

// Install: Precache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: Determine request type
const isNavigation = (request) => request.mode === 'navigate';
const isImage = (request) => request.destination === 'image';
const isScript = (request) => request.destination === 'script';
const isStyle = (request) => request.destination === 'style';

self.addEventListener('fetch', (event) => {
  // Strategy 1: Network First for HTML Navigation (ensures fresh content)
  if (isNavigation(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the fresh version
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => {
          // If network fails, fall back to cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy 2: Cache First for Static Assets (Images, Scripts, Styles, Fonts)
  if (isImage(event.request) || isScript(event.request) || isStyle(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy 3: Stale-While-Revalidate for everything else (JSON data, etc if applicable)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, do nothing (we already checked cache)
      });

      return cachedResponse || fetchPromise;
    })
  );
});