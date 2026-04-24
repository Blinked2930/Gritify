// public/sw.js
self.addEventListener('push', function (event) {
    const data = event.data?.json() ?? {};
    const title = data.title || "Gritify Alert";
    const options = {
      body: data.body || "Update from your partner.",
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: data.url || '/',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });
  
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data));
  });