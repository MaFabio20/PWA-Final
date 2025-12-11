// Nombre del caché
const CACHE_NAME = "colviseg-cache-v1";

// Archivos a cachear
const ASSETS = [
  "/",
  "/index.php",
  "/dashboard.php",
  "/manifest.json",
  "/js/app.js",
  "/assets/css/styles.css",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png"
];

// Nombre de la cola para POST offline
const queueName = "post-queue";

// INSTALACIÓN DEL SERVICE WORKER
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ACTIVACIÓN: elimina cachés antiguos
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

// INTERCEPTAR PETICIONES
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Manejo GET → Cache First
  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // Manejo POST → Guardar offline
  if (req.method === "POST") {
    event.respondWith(
      fetch(req).catch(async () => {
        const form = await req.clone().formData();
        const data = {};

        for (let pair of form.entries()) {
          data[pair[0]] = pair[1];
        }

        // Guardar en IndexedDB
        const db = await openDB();
        const tx = db.transaction(queueName, "readwrite");
        tx.objectStore(queueName).add({
          url: req.url,
          data: data,
          timestamp: Date.now()
        });

        return new Response(
          JSON.stringify({
            offline: true,
            message:
              "Ticket guardado offline. Se enviará automáticamente cuando vuelva Internet."
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
  }
});

// ABRIR INDEXEDDB
function openDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open("colviseg-db", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(queueName)) {
        db.createObjectStore(queueName, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

// BACKGROUND SYNC
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-post-queue") {
    event.waitUntil(resendQueuedPosts());
  }
});

// RECONECTAR POST GUARDADOS
async function resendQueuedPosts() {
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
        console.log("Sin conexión todavía...");
      }

      cursor.continue();
    }
  };
}

// JSON → FormData
function convertToFormData(obj) {
  const form = new FormData();
  for (const key in obj) {
    form.append(key, obj[key]);
  }
  return form;
}
