// Sendway — Service Worker
// IMPORTANTE: subir VERSION en cada versión nueva de la app (así el navegador detecta el cambio y actualiza el caché).
const VERSION = '2.9.17';
const CACHE = 'sendway-' + VERSION;
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('sendway-') === 0 && k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Todo lo que no sea de este mismo sitio (Gist de GitHub, Google Maps, etc.) pasa directo, sin caché.
  if (url.origin !== self.location.origin) return;

  // Abrir la app (incluye links de QR con ?o=...&pdf=1): siempre sirve el index guardado.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(function (r) { return r || fetch(req); })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return res;
      });
    })
  );
});
