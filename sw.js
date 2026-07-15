/*
 * Service Worker for PouchainApp Mobile (VAPK)
 * Handles Push Notifications
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let title = 'PouchainApp';
    let options = {
        body: event.data.text(),
        icon: 'favicon.png',
        badge: 'favicon.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            { action: 'explore', title: 'Voir l\'app', icon: 'favicon.png' },
            { action: 'close', title: 'Fermer', icon: 'favicon.png' },
        ]
    };

    // Try to parse JSON data if available
    try {
        const data = event.data.json();
        title = data.title || title;
        options.body = data.body || options.body;
        if (data.icon) options.icon = data.icon;
        // Keep the URL in the data if provided
        if (data.url) options.data.url = data.url;
    } catch (e) {
        // Fallback to text if not JSON
    }

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Try to find a window that is already open and focus it
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one (using URL from data if available)
            if (clients.openWindow) {
                const urlToOpen = (event.notification.data && event.notification.data.url) 
                    ? event.notification.data.url 
                    : '/';
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
