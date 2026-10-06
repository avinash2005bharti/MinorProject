const CACHE_NAME = 'campusflow-shell-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('campusflow-shell-') && cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    )),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (
    request.method !== 'GET'
    || requestUrl.origin !== self.location.origin
    || requestUrl.pathname.startsWith('/api/')
    || requestUrl.pathname.startsWith('/uploads/')
    || requestUrl.pathname.startsWith('/socket.io/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedShell = await caches.match('/');
        return cachedShell || Response.error();
      })
    );
    return;
  }

  if (!['script', 'style', 'image', 'font'].includes(request.destination)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache))
              .catch((error) => console.error('Failed to cache app asset:', error))
          );
        }
        return response;
      });
    })
  );
});
