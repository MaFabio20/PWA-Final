const CACHE_NAME = "colviseg-v7";

const ASSETS = [
  "/offline.html",
  "/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png",
  "/assets/img-pwa/favicon.png",
  "/manifest.json"
];

// INSTALACIÓN
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVACIÓN
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH — Network First con fallback a OFFLINE.HTML
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cached) => cached || caches.match("/offline.html"));
      })
  );
});
