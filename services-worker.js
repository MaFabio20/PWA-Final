const CACHE_NAME = "colviseg-v1";

const ASSETS = [
  "/index.php",  // Removed "/" as it's not cacheable; start with your main page
  "/dashboard.php",
  "/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png",
  "/assets/img-pwa/favicon.png",
  "/manifest.json"
];

// INSTALACIÓN
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache each asset individually to avoid addAll failures
      return Promise.all(
        ASSETS.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            } else {
              console.warn(`Failed to cache ${url}: ${response.status}`);
            }
          }).catch(error => {
            console.warn(`Error fetching ${url}:`, error);
            // Ignore errors to prevent install failure
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// ACTIVACIÓN
self.addEventListener("activate", e => {
  e.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return clients.claim();
    })
  );
});

// FETCH — Network First con fallback a caché
self.addEventListener("fetch", e => {
  // Only handle GET requests (default behavior, but explicit for clarity)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Only cache successful responses
        if (res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        // Si falla la red → servir desde caché
        return caches.match(e.request)
          .then(cached => cached || caches.match("/index.php"));
      })
  );
});
