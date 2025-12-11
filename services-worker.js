// ===============================
// CONFIG
// ===============================
const CACHE_NAME = "colviseg-v3";

const STATIC_ASSETS = [
  "/",                     // IMPORTANTE → permite cargar index.php sin internet
  "/index.php",
  "/dashboard.php",
  "/manifest.json",
  "/css/styles.css",
  "/js/app.js",
  "/assets/img-pwa/icon_192.png",
  "/assets/img-pwa/icon_512.png",
  "/assets/img-pwa/favicon.png"
];

const QUEUE_NAME = "ticket-queue";

// ===============================
// INSTALL
// ===============================
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ===============================
// ACTIVATE
// ===============================
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ===============================
// FETCH
// ===============================
self.addEventListener("fetch", event => {
  const req = event.request;

  // Guardar HTML dinámico (.php) en caché: NETWORK FIRST
  if (req.mode === "navigate" || req.url.endsWith(".php")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req) || caches.match("/index.php"))
    );
    return;
  }

  // Para archivos estáticos: CACHE FIRST
  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then(cacheRes =>
        cacheRes ||
        fetch(req).then(fetchRes => {
          const clone = fetchRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return fetchRes;
        })
      )
    );
    return;
  }

  // Manejo de POST OFFLINE (tickets)
  if (req.method === "POST") {
    event.respondWith(
      fetch(req).catch(async () => {
        const body = await req.clone().formData();
        let data = {};

        for (let p of body.entries()) data[p[0]] = p[1];

        const saved = { url: req.url, data, ts: Date.now() };

        const db = await openDB();
        const tx = db.transaction(QUEUE_NAME, "readwrite");
        tx.objectStore(QUEUE_NAME).add(saved);

        return new Response(
          JSON.stringify({
            offline: true,
            message: "Guardado offline. Se enviará al recuperar conexión."
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
  }
});

// ===============================
// IndexedDB
// ===============================
function openDB() {
  return new Promise(resolve => {
    const req = indexedDB.open("colviseg-db", 1);

    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_NAME)) {
        db.createObjectStore(QUEUE_NAME, { autoIncrement: true });
      }
    };

    req.onsuccess = () => resolve(req.result);
  });
}

// ===============================
// BACKGROUND SYNC
// ===============================
self.addEventListener("sync", async event => {
  if (event.tag === "sync-ticket-queue") {

    const db = await openDB();
    const tx = db.transaction(QUEUE_NAME, "readwrite");
    const store = tx.objectStore(QUEUE_NAME);

    store.openCursor().onsuccess = async e => {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;

        try {
          await fetch(item.url, {
            method: "POST",
            body: convertToForm(item.data)
          });

          store.delete(cursor.key);
        } catch (err) {
          console.log("Sin internet, reintentando…");
        }

        cursor.continue();
      }
    };
  }
});

function convertToForm(obj) {
  const fd = new FormData();
  for (let k in obj) fd.append(k, obj[k]);
  return fd;
}
