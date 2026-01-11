// Service Worker for MkulimaLink PWA
const CACHE_NAME = 'mkulimalink-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('📦 Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests (except API)
  if (url.origin !== location.origin && !url.pathname.startsWith('/api')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          console.log('📋 Cache hit:', request.url);
          return response;
        }
        
        // Cache miss - fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response.ok) {
              console.log('❌ Network error:', request.url);
              return response;
            }
            
            // Clone response before caching
            const responseClone = response.clone();
            
            // Cache API responses with short TTL
            if (url.pathname.startsWith('/api/')) {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  console.log('💾 Caching API response:', request.url);
                  cache.put(request, responseClone);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.log('🌐 Network failed:', request.url);
            
            // Try to serve from cache for API errors
            if (url.pathname.startsWith('/api/')) {
              return caches.match(request);
            }
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return error for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MkulimaLink', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app to relevant page
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions
async function syncOfflineActions() {
  try {
    // Get all pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        // Retry the failed request
        await fetch(action.url, action.options);
        
        // Remove from pending actions
        await removePendingAction(action.id);
        
        console.log('✅ Synced action:', action.id);
      } catch (error) {
        console.error('❌ Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// IndexedDB helpers for offline actions
async function getPendingActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mkulimalink-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removePendingAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mkulimalink-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('⏰ Periodic sync:', event.tag);
    
    if (event.tag === 'sync-data') {
      event.waitUntil(syncAppData());
    }
  });
}

// Sync app data in background
async function syncAppData() {
  try {
    // Sync user data, products, etc.
    const response = await fetch('/api/sync');
    if (response.ok) {
      console.log('✅ Background data sync successful');
    }
  } catch (error) {
    console.error('❌ Background data sync failed:', error);
  }
}

// Message from client
self.addEventListener('message', (event) => {
  console.log('📨 Message from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cleanup old caches periodically
self.addEventListener('message', (event) => {
  if (event.data === 'cleanup-cache') {
    cleanupCache();
  }
});

async function cleanupCache() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name !== STATIC_CACHE && 
      name !== DYNAMIC_CACHE
    );
    
    await Promise.all(
      oldCaches.map(name => caches.delete(name))
    );
    
    console.log('🧹 Cache cleanup completed');
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}
