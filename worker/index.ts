/// <reference lib="webworker" />
export type {}; // Forces TypeScript to treat this file as an isolated module

declare const self: ServiceWorkerGlobalScope;

// Custom Service Worker for Push Notifications
self.addEventListener("push", (event: any) => {
  const data = JSON.parse(event?.data.text() || "{}");
  const title = data.title || "Gritify Update";
  const body = data.body || "Your partner just logged an action.";
  const icon = "/icon-192x192.png";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/icon-192x192.png",
      vibrate: [200, 100, 200],
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients: any) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});