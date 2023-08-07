const CACHE_VERSION = "5";

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(`static-v${CACHE_VERSION}`).then((cache) => {
      console.log("[Service Worker] Precaching app shell");
      cache.addAll([
        "/",
        "/index.html",
        "/src/js/app.js",
        "/src/js/feed.js",
        "/src/js/promise.js",
        "/src/js/fetch.js",
        "/src/js/material.min.js",
        "/src/css/app.css",
        "/src/css/feed.css",
        "/src/images/main-image.jpg",
        "https://fonts.googleapis.com/css?family=Roboto:400,700",
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker ...", event);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (
            key !== `static-v${CACHE_VERSION}` &&
            key !== `dynamic-v${CACHE_VERSION}`
          ) {
            console.log("[Service Worker] Removing old cache.", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // console.log("[Service Worker] Fetching something ...", event);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((res) => {
          return caches.open(`dynamic-v${CACHE_VERSION}`).then((cache) => {
            cache.put(event.request.url, res.clone());
            return res;
          });
        })
        .catch((err) => {});
    })
  );
});
