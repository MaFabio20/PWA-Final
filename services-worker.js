const CACHE_NAME = "colviseg-v4";  // Actualizado para forzar recarga

const ASSETS = [
  "/",  // Quita esta línea si causa problemas (es opcional)
  "/index.php",
  "/dashboard.php",
  "/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png",
  "/assets/img-pwa/favicon.png",
  "/manifest.json"
];

// INSTALACIÓN — Usando cache.add() en loop para manejar errores
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear assets uno por uno, ignorando errores individuales
      const promises = ASSETS.map(url => {
        return cache.add(url).catch(err => {
          console.warn(`[Service Worker] Failed to cache ${url}:`, err);
          // Continúa con los demás assets
        });
      });
      return Promise.all(promises);
    })
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

// FETCH — CACHE FIRST
self.addEventListener("fetch", e => {
  // Solo interceptar solicitudes GET
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type !== "basic") {
            return res;
          }
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, clone);
          });
          return res;
        })
        .catch(() => {
          // Fallback para offline
          if (e.request.mode === "navigate") {
            const fallbackUrl = e.request.url.includes("/dashboard.php") ? "/dashboard.php" : "/index.php";
            return caches.match(fallbackUrl).then(cached => {
              if (cached) return cached;
              return new Response(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - Colviseg</title>
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
                    h1 { color: #333; }
                    p { color: #666; }
                  </style>
                </head>
                <body>
                  <h1>Sin conexión a internet</h1>
                  <p>La página que buscas no está disponible offline. Conéctate a internet para continuar.</p>
                  <p><a href="/">Ir al inicio</a></p>
                </body>
                </html>
              `, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
              });
            });
          }
        });
    })
  );
});
