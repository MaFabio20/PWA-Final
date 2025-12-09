// Nombre del caché
const CACHE_NAME = "colviseg-cache-v1";

// Archivos a cachear
const ASSETS = [
  "/",
  "/index.php",
  "/dashboard.php",
  "/manifest.json",
  "/assets/css/styles.css",
  "/assets/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png"
];

// INSTALACIÓN — se guarda en caché
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVACIÓN — limpia cachés viejos
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ESTRATEGIA: CACHE FIRST con fallback a red
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // No cachear peticiones POST
  if (req.method === "POST") {
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req);
    })
  );
});

// GUARDAR PETICIONES SIN INTERNET
self.addEventListener("fetch", (e) => {
  if (e.request.method === "POST") {
    e.respondWith(
      fetch(e.request).catch(() => {
        // Si no hay Internet → guardar en Background Sync
        saveRequestForSync(e.request.clone());
        return new Response(
          JSON.stringify({ offline: true, msg: "Guardado offline" }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
  }
});

// Guardar peticiones POST pendientes en IndexedDB
function saveRequestForSync(req) {
  const reader = req.text();
  reader.then((body) => {
    const data = {
      url: req.url,
      method: req.method,
      body,
      headers: [...req.headers]
    };

    // Guardar en IndexedDB
    addToIDB("pending", data).then(() => {
      registerSync();
    });
  });
}

// Registrar sincronización en segundo plano
function registerSync() {
  self.registration.sync.register("sync-tickets");
}

// Sincronizar cuando vuelva Internet
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tickets") {
    event.waitUntil(sendPendingRequests());
  }
});

// Enviar peticiones guardadas
async function sendPendingRequests() {
  const all = await getAllFromIDB("pending");

  for (const req of all) {
    await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
  }

  clearIDB("pending");
}

/* -----------------------------
   IndexedDB Helper Functions  
--------------------------------*/
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("colviseg-db", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToIDB(store, data) {
  const db = await getDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).add(data);
  return tx.complete;
}

async function getAllFromIDB(store) {
  const db = await getDB();
  const tx = db.transaction(store, "readonly");
  const req = tx.objectStore(store).getAll();
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
  });
}

async function clearIDB(store) {
  const db = await getDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).clear();
  return tx.complete;
}
