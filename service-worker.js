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

// Cola para almacenar POST pendientes
const queueName = "post-queue";

// Instalar SW y cachear archivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activar SW y limpiar caches antiguos
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

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Si es GET → usar cache first
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
          data: data,
          timestamp: Date.now()
        };

        const db = await openDB();
        const tx = db.transaction(queueName, "readwrite");
        tx.objectStore(queueName).add(queued);

        return new Response(
          JSON.stringify({
            offline: true,
            message: "Ticket guardado offline. Se enviará cuando vuelva internet."
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
  }
});

// Base de datos IndexedDB para cola de POST
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

// Reintentar enviar POST cuando vuelve la conexión
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
          console.log("Aún sin internet para enviar ticket.");
        }

        cursor.continue();
      }
    };
  }
});

// Convertir JSON → FormData
function convertToFormData(obj) {
  const form = new FormData();
  for (let key in obj) {
    form.append(key, obj[key]);
  }
  return form;
}
