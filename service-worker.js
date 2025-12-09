// Nombre del caché
const CACHE_NAME = "colviseg-cache-v1";

// Archivos que se guardan offline
const ASSETS = [
  "./",
  "./index.php",
  "./dashboard.php",
  "./css/styles.css",
  "./js/app.js",
  "./manifest.json",
  "./assets/img-pwa/icon_512.png",
  "./offline.html"
];

// Instalación del SW y almacenamiento inicial
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de caches viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Estrategia de red → si no hay internet, usar caché
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar respuestas nuevas en cache
        let clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Si no hay red, devolver contenido offline
        return caches.match(event.request).then((resp) => {
          return resp || caches.match("./offline.html");
        });
      })
  );
});
