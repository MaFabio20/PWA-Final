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
          // Fallback mejorado para offline: SIEMPRE devolver una Response válida
          if (e.request.mode === "navigate") {
            // Intentar devolver la página específica si está en caché
            const fallbackUrl = e.request.url.includes("/dashboard.php") ? "/dashboard.php" : "/index.php";
            return caches.match(fallbackUrl).then(cached => {
              if (cached) return cached;
              // Si no hay caché, devolver una página básica de offline
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
