// Firebase Cloud Messaging Service Worker for Compassionate Care
// Handles background push notifications for 1-hour pre-visit check-in reminders

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
try {
  firebase.initializeApp({
    apiKey: "AIzaSyD8Tz18BYKa0zrVwzF42oZ8t4L_Ach0Sdk",
    authDomain: "pure-summer-lvd6f.firebaseapp.com",
    projectId: "pure-summer-lvd6f",
    storageBucket: "pure-summer-lvd6f.firebasestorage.app",
    messagingSenderId: "311006435323",
    appId: "1:311006435323:web:b8fb5f155bf4d72f8b1d5e"
  });

  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Compassionate Care: Upcoming Visit Reminder';
    const body = payload.notification?.body || payload.data?.body || 'A scheduled companionship visit is starting in 1 hour. Tap to check in or review details.';

    const notificationOptions = {
      body: body,
      icon: '/icon.png',
      badge: '/badge.png',
      tag: payload.data?.bookingId || 'visit-1hr-reminder',
      renotify: true,
      data: payload.data || {},
      actions: [
        { action: 'check_in', title: '✓ Check In' },
        { action: 'review_details', title: 'Review Details' }
      ]
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (error) {
  console.warn('[firebase-messaging-sw.js] Fallback service worker listener initialized:', error);
}

// Fallback native push event listener
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || data.title || 'Upcoming Visit in 1 Hour';
    const options = {
      body: data.notification?.body || data.body || 'Tap to check in or review visit details.',
      icon: '/icon.png',
      tag: data.data?.bookingId || '1hr-reminder',
      data: data.data || {},
      actions: [
        { action: 'check_in', title: '✓ Check In' },
        { action: 'review_details', title: 'Review Details' }
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[firebase-messaging-sw.js] Push parse error:', err);
  }
});

// Handle notification click action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || 'review_details';
  const bookingId = event.notification.data?.bookingId || '';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
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
      if (clients.openWindow) {
        return clients.openWindow(`/?action=${action}&bookingId=${bookingId}`);
      }
    })
  );
});
