// Nombre del caché
const CACHE_NAME = "colviseg-cache-v1";

// Archivos a cachear
const ASSETS = [
  "/",
  "/index.php",
  "/dashboard.php",
  "/manifest.json",
  "/assets/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png"
];

// Cola para POST offline
const queueName = "post-queue";

// INSTALACIÓN -----------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVACIÓN ------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH ------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Si es GET → cache first
  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then((res) => res || fetch(req))
    );
    return;
  }

  // Si es POST → manejar offline
  if (req.method === "POST") {
    event.respondWith(
      fetch(req).catch(async () => {
        // Guardar POST en cola
        const body = await req.clone().formData();
        const data = {};

        for (let pair of body.entries()) {
          data[pair[0]] = pair[1];
        }

        const queued = {
          url: req.url,
          data,
          timestamp: Date.now()
        };

        const db = await openDB();
        const tx = db.transaction(queueName, "readwrite");
        tx.objectStore(queueName).add(queued);

        return new Response(
          JSON.stringify({
            offline: true,
            message: "Sin Internet. El ticket se enviará cuando vuelva la conexión."
          }),
          {
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
  }
});

// IndexedDB ----------------------------------------------------------
function openDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open("colviseg-db", 1);

    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains(queueName)) {
        db.createObjectStore(queueName, { autoIncrement: true });
      }
    };

    request.onsuccess = function () {
      resolve(request.result);
    };
  });
}

// REINTENTAR ENVÍO -------------------------------------------------------
self.addEventListener("sync", async (event) => {
  if (event.tag === "sync-post-queue") {
    const db = await openDB();
    const tx = db.transaction(queueName, "readwrite");
    const store = tx.objectStore(queueName);

    store.openCursor().onsuccess = async (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;

        try {
          await fetch(item.url, {
            method: "POST",
            body: convertToFormData(item.data)
          });
          store.delete(cursor.key);
        } catch (err) {
          console.log("Sin internet para reenviar ticket.");
        }

        cursor.continue();
      }
    };
  }
});

// Convertir JSON→FormData
function convertToFormData(obj) {
  const form = new FormData();
  for (let k in obj) form.append(k, obj[k]);
  return form;
}
