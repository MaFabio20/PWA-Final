const CACHE_NAME = "colviseg-v3";

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

self.addEventListener("install", (event) => {
  console.log("SW: Instalando…");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .catch(err => {
        console.warn("SW: Error cacheando (NO detiene instalación):", err);
      })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW: Activado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cached) => cached || caches.match("/index.php"));
      })
  );
});
