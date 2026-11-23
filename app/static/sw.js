/*
 * Service worker: makes ApiLog work offline.
 *
 * - App files (HTML, CSS, JS, icons): cache first, so the app opens without network.
 * - GET requests to /api: network first, and the last saved response when offline.
 * - Changes (POST, PUT, DELETE) don't go through here. The queue in app.js
 *   (IndexedDB) sends them when the network is back.
 */
const CACHE = "apilog-v11"; // change this every time the app files change
const SHELL = [
  "/",
  "/static/app.js",
  "/static/i18n.js",
  "/static/knowledge.js",
  "/static/styles.css",
  "/manifest.json",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // changes are handled by the queue in app.js

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    // data: network first
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // app files: cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
