const CACHE = 'cc-v3';
const ASSETS = ['/','/index.html','/css/app.css','/js/utils.js','/js/api.js','/js/components.js','/js/views/login.js','/js/views/owner.js','/js/views/manager.js','/js/views/accountant.js','/js/app.js','/manifest.json','/icons/favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // API: network only
  if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/auth/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({error:'Offline'}), {status:503, headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Static: stale-while-revalidate
  e.respondWith(caches.match(e.request).then(cached => {
    const fetched = fetch(e.request).then(res => {
      if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
      return res;
    }).catch(() => cached);
    return cached || fetched;
  }));
});
