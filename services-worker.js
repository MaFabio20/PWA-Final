const CACHE_NAME = "colviseg-v1";

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
  e.waitUntil(clients.claim());
});

// FETCH — Network First con fallback a caché
self.addEventListener("fetch", e => {

  // ⛔ IMPORTANTE: No cachear POST, login, envíos de ticket, AJAX, etc.
  if (e.request.method !== "GET") {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar copia en caché
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => {
        // Si falla la red → servir desde caché
        return caches.match(e.request)
          .then(cached => cached || caches.match("/index.php"));
      })
  );
});
