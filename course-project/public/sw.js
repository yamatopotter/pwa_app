importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const CACHE_VERSION = "8";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/idb.js",
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
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(`static-v${CACHE_VERSION}`).then((cache) => {
      console.log("[Service Worker] Precaching app shell");
      cache.addAll(STATIC_FILES);
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

const isInArray = (string, array) => {
  let cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
};

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName).then((cache) =>
//     cache.keys().then((keys) => {
//       if (keys.length > maxItems) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//       }
//     })
//   );
// }

// Cache then Network
self.addEventListener("fetch", (event) => {
  const url = "https://teste-d4240-default-rtdb.firebaseio.com/posts";
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clonedRes = res.clone();
        clearAllData("posts")
          .then(() => clonedRes.json())
          .then((data) => {
            for (const key in data) {
              writeData("posts", data[key]);
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((res) => {
            return caches.open(`dynamic-v${CACHE_VERSION}`).then((cache) => {
              // trimCache(`dynamic-v${CACHE_VERSION}`, 20);
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch((err) => {
            return caches.open(`static-v${CACHE_VERSION}`).then((cache) => {
              if (event.request.headers.get("accept").includes("text/html")) {
                return cache.match("/offline.html");
              }
            });
          });
      })
    );
  }
});

// Cache first, Network fallback
// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       if (response) {
//         return response;
//       }

//       return fetch(event.request)
//         .then((res) => {
//           return caches.open(`dynamic-v${CACHE_VERSION}`).then((cache) => {
//             cache.put(event.request.url, res.clone());
//             return res;
//           });
//         })
//         .catch((err) => {
//           return caches.open(`static-v${CACHE_VERSION}`).then((cache) => {
//             return cache.match("/offline.html");
//           });
//         });
//     })
//   );
// });

// Cache only method
// self.addEventListener("fetch", (event) => {
//   event.respondWith(caches.match(event.request));
// });

// Network only method
// self.addEventListener("fetch", (event) => {
//   event.respondWith(fetch(event.request));
// });

// Network first, Cache fallback
// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     fetch(event.request)
//       .then((res) => {
//         return caches.open(`dynamic-v${CACHE_VERSION}`).then((cache) => {
//           cache.put(event.request.url, res.clone());
//           return res;
//         });
//       })
//       .catch((err) => {
//         return caches.match(event.request);
//       })
//   );
// });

self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new posts");
    event.waitUntil(
      readAllData("sync-posts").then((data) => {
        for (const post of data) {
          fetch(
            "https://us-central1-teste-d4240.cloudfunctions.net/storePostData",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                id: post.id,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/teste-d4240.appspot.com/o/sf-boat.jpg?alt=media&token=25586f70-6b19-480d-ab4b-f08104f528a1",
                title: post.title,
                location: post.location,
              }),
            }
          )
            .then((res) => {
              console.log("Sent data", res);
              if (res.ok) {
                res.json().then((resData) => {
                  deleteItemFromData("sync-posts", resData.id);
                });
              }
            })
            .catch((err) => console.log("Error while sending data", err));
        }
      })
    );
  }
});

self.addEventListener("notigicationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  console.log(notification);
  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    notification.close();
  }
});

self.addEventListener("notificationclose", (event)=>{
  console.log("Notification was closed", event)
})