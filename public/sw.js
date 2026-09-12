// Compassionate Care - Progressive Web App Service Worker (PWA & PWABuilder Compliant)
// Provides offline app shell caching, fetch interception, background sync & push notifications

const CACHE_NAME = 'compassionate-care-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/screenshots/screenshot-wide.jpg',
  '/screenshots/screenshot-narrow.jpg'
];

// Install: Precaches the critical PWA shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching offline app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache partial error (continuing):', err);
      });
    })
  );
});

// Activate: Cleans up obsolete cache versions and claims clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Intercepts network requests to provide offline support (required by PWABuilder & Lighthouse)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and API calls from caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with Network Only or fast timeout
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle Web Font and Static Assets with Cache First / Stale While Revalidate
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // HTML Navigation Requests: Network first with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone to cache
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Standard Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      });
    })
  );
});

// Push Notifications Listener (1-hour pre-visit check-in reminders)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || data.title || 'Compassionate Care: Visit Reminder';
    const options = {
      body: data.notification?.body || data.body || 'A scheduled companionship visit is starting in 1 hour.',
      icon: '/pwa-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.data?.bookingId || 'visit-reminder',
      renotify: true,
      data: data.data || {},
      actions: [
        { action: 'check_in', title: '✓ Check In' },
        { action: 'review_details', title: 'Review Details' }
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[PWA SW] Push event error:', err);
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || 'review_details';
  const bookingId = event.notification.data?.bookingId || '';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'FCM_NOTIFICATION_CLICK',
            action: action,
            bookingId: bookingId,
            data: event.notification.data
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(`/?tab=bookings&action=${action}&bookingId=${bookingId}`);
      }
    })
  );
});
