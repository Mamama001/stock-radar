const CACHE = 'stock-radar-v5';
const ASSETS = ['./stock-monitor.html', './manifest.json', './icon-192.svg', './icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Local assets: cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(r =>
        r || fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
          return res;
        }).catch(() => caches.match(e.request))
      )
    );
    return;
  }

  // API requests: network-first, no caching
  e.respondWith(
    fetch(e.request).catch(() => new Response('', { status: 503 }))
  );
});
