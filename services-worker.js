const CACHE_NAME = 'colviseg-v5';  // Actualizado para forzar recarga

const URLS_TO_CACHE = [
  '/',
  '/index.php',
  '/dashboard.php',
  '/css/styles.css',
  '/js/app.js',
  '/assets/img-pwa/icon_192.png',
  '/assets/img-pwa/icon_512.png',
  '/assets/img-pwa/favicon.png',
  '/manifest.json'
];

// Instalación: cachea todos los archivos (con manejo de errores como en el ejemplo)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE)
        .catch(err => {
          console.warn('Error cacheando:', err);
        });
    })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: estrategia network-first con fallback a cache (como en el ejemplo)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, clone);
        });
        return res;
      })
      .catch(() => {
        // Intentar servir desde cache
        return caches.match(e.request).then(res => {
          if (res) return res;
          // Último fallback: regresar index.php
          return caches.match('/index.php');
        });
      })
  );
});
