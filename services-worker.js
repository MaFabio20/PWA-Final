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

// INSTALACIÓN — mejorada para evitar errores que bloquean la instalación
self.addEventListener("install", (event) => {
  console.log("SW: Instalando…");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .catch(err => {
        // IMPORTANTÍSIMO: capturar errores evita que Chrome bloquee la instalación
        console.warn("SW: Error cacheando (NO detiene instalación):", err);
      })
  );

  self.skipWaiting();
});

// ACTIVACIÓN
self.addEventListener("activate", (event) => {
  console.log("SW: Activado");
  event.waitUntil(self.clients.claim());
});

// FETCH — network first con fallback a cache
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
