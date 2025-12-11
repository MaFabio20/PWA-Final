// Nombre del caché
const CACHE_NAME = "colviseg-cache-v1";

// Archivos a cachear (solo assets estáticos, no páginas dinámicas)
const ASSETS = [
  "/",  // Esto podría ser problemático si es dinámico; considera removerlo o cachearlo solo si es estático
  "/manifest.json",
  "/assets/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png"
];

// Cola de solicitudes POST offline
const queueName = "post-queue";

// INSTALACIÓN — Cachear archivos (corregido: loop con manejo de errores)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
          console.log(`Cacheado exitosamente: ${asset}`);
        } catch (error) {
          console.warn(`Error al cachear ${asset}:`, error);
        }
      }
    })
  );
  self.skipWaiting();
});

// ACTIVACIÓN — Limpiar caches viejos
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

// FETCH — Network First para páginas dinámicas (.php), Cache First para assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Para páginas dinámicas (ej. .php): Network First, pero evitar loops
  if (req.method === "GET" && url.pathname.endsWith('.php')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Si es una redirección, no cachear
          if (res.redirected) {
            return res;
          }
          return res;
        })
        .catch(() => {
          // Si falla la red, intenta cache solo una vez
          return caches.match(req) || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Resto igual...


  // Para assets estáticos: Cache First
  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then((res) => res || fetch(req))
    );
    return;
  }

  // POST (tickets) — Sin cambios
  if (req.method === "POST") {
    event.respondWith(
      fetch(req).catch(async () => {
        const body = await req.clone().formData();
        const data = {};

        for (let pair of body.entries()) {
          data[pair[0]] = pair[1];
        }

        const save = {
          url: req.url,
          data: data,
          ts: Date.now()
        };

        // Guardar en IndexedDB
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

// IndexedDB para almacenamiento de POST offline
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

// BACKGROUND SYNC — Reenviar POST cuando vuelva internet
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
          console.warn("Internet no disponible, reintentando luego...");
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
