// Service worker for Web Push notifications (food-logger meal reminders).
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'Food Logger';
  const options = {
    body: data.body || 'Time to log your meal 🍽️',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: data.tag || 'meal-reminder',
    data: { url: data.url || '/log' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/log';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) { w.navigate(url); return w.focus(); }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
