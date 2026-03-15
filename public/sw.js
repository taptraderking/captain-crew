const CACHE_NAME = 'captain-crew-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/utils.js',
  '/js/api.js',
  '/js/components.js',
  '/js/views/login.js',
  '/js/views/owner.js',
  '/js/views/manager.js',
  '/js/views/accountant.js',
  '/js/app.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — network first, no cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      })
    ));
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
