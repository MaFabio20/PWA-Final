const CACHE_NAME = "colviseg-v2";

const ASSETS = [
  "/",
  "/index.php",
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
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVACIÓN
self.addEventListener("activate", e => {
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


// FETCH — CACHE FIRST para HTML y PHP
self.addEventListener("fetch", e => {

  // Interceptamos todo
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Si existe en caché, devolverlo INMEDIATO (OFFLINE FUNCIONA)
      if (cached) return cached;

      // Si no existe → intentar red con fallback
      return fetch(e.request)
        .then(res => {
          // Guardamos una copia EN CACHÉ (incluye HTML generado del PHP)
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, clone);
          });
          return res;
        })
        .catch(() => {
          // Si no hay internet, devolver INDEX como fallback
          if (e.request.mode === "navigate") {
            return caches.match("/index.php");
          }
        });
    })
  );
});
