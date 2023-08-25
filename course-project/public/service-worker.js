importScripts("workbox-sw.prod.v2.1.3.js");

const workboxSW = new self.WorkboxSW();
workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "google-fonts",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({ cacheName: "post-images" })
);

workboxSW.router.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workboxSW.strategies.staleWhileRevalidate({ cacheName: "material-css" })
);

workboxSW.router.registerRoute(
  "https://teste-d4240-default-rtdb.firebaseio.com/posts.json",
  (args) => {
    fetch(args.event.request).then((res) => {
      const clonedRes = res.clone();
      clearAllData("posts")
        .then(() => clonedRes.json())
        .then((data) => {
          for (const key in data) {
            writeData("posts", data[key]);
          }
        });
      return res;
    });
  }
);

workboxSW.router.registerRoute(
  (routerData) => {
    return routerData.event.request.headers.get("accept").includes("text/html");
  },
  (args) => {
    return caches.match(args.event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(args.event.request)
        .then((res) => {
          return caches.open(`dynamic`).then((cache) => {
            cache.put(args.event.request.url, res.clone());
            return res;
          });
        })
        .catch((err) => {
          return caches.match("/offline.html").then((res) => {
            return res;
          });
        });
    });
  }
);

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "efa8f497d7ca533b34489c8d18200e4f"
  },
  {
    "url": "manifest.json",
    "revision": "14f95b3e4636e6b6adfa8c96e6e9e3fd"
  },
  {
    "url": "offline.html",
    "revision": "1eb754664433dd48d3ec828b118b6957"
  },
  {
    "url": "src/css/app.css",
    "revision": "dc2e7652d77e3e0ce746641592abc77f"
  },
  {
    "url": "src/css/feed.css",
    "revision": "b2c8d79100b6ddac55159e41805f4cb1"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "685aa68a545bb2ab74a55d6eb10cdccf"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "5db6d94e66871a4ab92e7bd6d810a334"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "80ccc680cbfed27824c9034064581f60"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "1591dd473d28207180abd491a2cfce90"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "df88ae76718e421901c2293b59e979b7"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "ba2d22d95c302ceca3d3c9ded0faee48"
  }
]);

self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new posts");
    event.waitUntil(
      readAllData("sync-posts").then((data) => {
        for (const post of data) {
          const postData = new FormData();
          postData.append("id", post.id);
          postData.append("title", post.title);
          postData.append("location", post.location);
          postData.append("rawLocationLng", post.rawLocation.lng);
          postData.append("rawLocationLat", post.rawLocation.lat);
          postData.append("file", post.picture, post.id + ".png");

          fetch(
            "https://us-central1-teste-d4240.cloudfunctions.net/storePostData",
            {
              method: "POST",
              body: postData,
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

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  console.log(notification);
  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then((clis) => {
        const client = clis.find((c) => c.visibilityState === "visible");
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification was closed", event);
});

self.addEventListener("push", (event) => {
  console.log("Push Notification received", event);
  let data = {
    title: "New!",
    content: "Something happened!",
    openUrl: "/help",
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
