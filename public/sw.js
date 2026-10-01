const CACHE_NAME = 'devmapper-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, dev server modules, and Supabase API calls
  if (request.method !== 'GET') return;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.lovableproject.com')) return;
  if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/') || url.pathname.includes('/@vite/')) return;
  if (url.hostname.includes('supabase')) return;

  // API/dynamic routes: network-first
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/functions')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML documents (navigations): network-first, not stale-while-revalidate.
  // This is the file that names the current build's content-hashed chunk
  // filenames - serving a stale copy sends the browser looking for JS chunks
  // from a deploy that's since been pruned from the server, which is exactly
  // what breaks a returning visitor after a new deploy ships (lazy-loaded
  // chunks 404 at the origin, Suspense throws, the page shows the error
  // boundary). Hashed assets below are safe to cache stale since a given
  // filename's content never changes.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetching = fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
      return cached || fetching;
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'DevMapper';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png',
    badge: '/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png',
    data: data.url || '/',
    tag: data.tag || 'default',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const url = event.notification.data || '/';
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
