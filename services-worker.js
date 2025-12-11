// Nombre del caché
const CACHE_NAME = "colviseg-cache-v1";

// Archivos a cachear (solo assets estáticos)
const ASSETS = [
  "/manifest.json",
  "/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/favicon.png",
  "/assets/img-pwa/icon_512.png"
];

// Rutas de autenticación que NO deben pasar por SW
const authRoutes = ["login", "logout", "cerrar", "session", "auth"];

// Cola de solicitudes POST offline
const queueName = "post-queue";

// INSTALACIÓN
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try { await cache.add(asset); }
        catch (error) { console.warn("Error cacheando", asset); }
      }
    })
  );
  self.skipWaiting();
});

// ACTIVACIÓN
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 🔥 Bloquear rutas de login/logout/sesión
  if (authRoutes.some(x => url.pathname.includes(x))) {
    event.respondWith(fetch(req));
    return;
  }

  // 🔥 Bloquear TODAS las rutas dinámicas .php (con o sin parámetros)
  if (req.method === "GET" && url.pathname.includes(".php")) {
    event.respondWith(
      fetch(req)
        .then(res => res)
        .catch(() => caches.match(req) || new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Cache First para archivos estáticos
  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // POST (tickets offline)
  if (req.method === "POST") {
    event.respondWith(
      fetch(req).catch(async () => {
        const body = await req.clone().formData();
        let data = {};

        for (let pair of body.entries()) {
          data[pair[0]] = pair[1];
        }

        const save = { url: req.url, data: data, ts: Date.now() };

        const db = await openDB();
        const tx = db.transaction(queueName, "readwrite");
        tx.objectStore(queueName).add(save);

        return new Response(
          JSON.stringify({
            ok: false,
            offline: true,
            message: "Sin internet. El ticket se enviará automáticamente."
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
  }
});

// IndexedDB
function openDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open("colviseg-db", 1);

    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(queueName)) {
        db.createObjectStore(queueName, { autoIncrement: true });
      }
    };

    req.onsuccess = function () {
      resolve(req.result);
    };
  });
}

// BACKGROUND SYNC
self.addEventListener("sync", async (event) => {
  if (event.tag === "sync-post-queue") {
    const db = await openDB();
    const tx = db.transaction(queueName, "readwrite");
    const store = tx.objectStore(queueName);

    store.openCursor().onsuccess = async function (e) {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;

        try {
          await fetch(item.url, {
            method: "POST",
            body: convertToFormData(item.data)
          });
          store.delete(cursor.key);
        } catch (error) {
          console.warn("Internet no disponible, reintentando luego…");
        }

        cursor.continue();
      }
    };
  }
});

// Convertir JSON → FormData
function convertToFormData(obj) {
  const fd = new FormData();
  for (let k in obj) fd.append(k, obj[k]);
  return fd;
}
