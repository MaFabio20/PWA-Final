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

// INSTALACIÓN (sin cambios)
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVACIÓN (sin cambios)
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

// FETCH — CACHE FIRST mejorado para HTML y PHP
self.addEventListener("fetch", e => {
  // Solo interceptar solicitudes GET (evita cachear POST, login, etc.)
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Si existe en caché, devolverlo INMEDIATO (OFFLINE FUNCIONA)
      if (cached) return cached;

      // Si no existe → intentar red con fallback
      return fetch(e.request)
        .then(res => {
          // Solo cachear respuestas exitosas (status 200)
          if (!res || res.status !== 200 || res.type !== "basic") {
            return res; // No cachear errores o respuestas no básicas
          }
          // Guardamos una copia EN CACHÉ (incluye HTML generado del PHP)
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, clone);
          });
          return res;
        })
        .catch(() => {
          // Fallback mejorado para offline
          if (e.request.mode === "navigate") {
            // Si es navegación a dashboard y está en caché, devolverlo
            if (e.request.url.includes("/dashboard.php")) {
              return caches.match("/dashboard.php") || caches.match("/index.php");
            }
            // Para otras navegaciones, devolver index
            return caches.match("/index.php");
          }
        });
    })
  );
});
