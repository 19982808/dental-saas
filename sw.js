const CACHE_NAME = "dental-saas-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/manifest.json"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

/* =========================
   ACTIVATE (CLEAN OLD CACHE)
========================= */
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

/* =========================
   FETCH (CACHE FIRST STRATEGY)
========================= */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => {
        // optional offline fallback could go here
      });
    })
  );
});
