// Service Worker optimisé pour BookingFast
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `bookingfast-${CACHE_VERSION}`;

// Ressources à mettre en cache lors de l'installation
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Stratégie de cache: Network First avec fallback
const CACHE_STRATEGIES = {
  // Toujours du réseau d'abord pour les APIs
  API: 'network-first',
  // Cache d'abord pour les assets statiques
  STATIC: 'cache-first',
  // Réseau seulement pour les données sensibles
  DYNAMIC: 'network-only'
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installation en cours...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache ouvert');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activation en cours...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation terminée');
        return self.clients.claim();
      })
  );
});

// Stratégie Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stratégie Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers des domaines externes (sauf fonts)
  if (url.origin !== location.origin && !url.hostname.includes('googleapis') && !url.hostname.includes('gstatic')) {
    return;
  }

  // API Supabase: toujours du réseau
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) {
    return;
  }

  // Assets statiques: Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/) ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Par défaut: Network First
  event.respondWith(networkFirst(request));
});

// Gestion des messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Synchronisation en arrière-plan (optionnel)
self.addEventListener('sync', (event) => {
  console.log('🔄 Synchronisation en arrière-plan:', event.tag);

  if (event.tag === 'sync-bookings') {
    event.waitUntil(
      // Logique de synchronisation ici
      Promise.resolve()
    );
  }
});

// Notifications Push (optionnel)
self.addEventListener('push', (event) => {
  console.log('📨 Notification Push reçue');

  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('BookingFast', options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Clic sur notification');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('✅ Service Worker chargé et prêt');
