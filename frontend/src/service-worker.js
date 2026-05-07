/* eslint-disable no-restricted-globals */
/* global clients importScripts workbox */

// This service worker file is compatible with Workbox
// Workbox injects the precache manifest automatically in production builds

// Import Workbox from CDN (for custom service worker)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'mkulimalink-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Use Workbox if available, otherwise fall back to standard SW
if (typeof workbox !== 'undefined') {
  // Precache and route setup for Workbox
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  // Cache images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );
  
  // Cache API calls with stale-while-revalidate
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    })
  );
}

// Standard SW fallback for development
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API calls - network only with timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Static assets - cache first
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
    );
    return;
  }

  // Default - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // Return offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Network and cache unavailable');
        });
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Process queued requests from IndexedDB
  // This would integrate with your offline queue system
  console.log('[SW] Background sync executed');
}

// Push notification support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'mkulimalink-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('MkulimaLink', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_ASSETS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.assets);
      })
    );
  }
});

/* eslint-enable no-restricted-globals */
