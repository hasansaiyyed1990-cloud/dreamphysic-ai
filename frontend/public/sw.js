// Minimal pass-through service worker: makes the app installable as a PWA.
// API calls and assets always go to the network so logged-in data is never stale.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // No respondWith(): the browser handles the request normally.
});
