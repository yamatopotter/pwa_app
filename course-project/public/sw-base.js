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

workboxSW.precache([]);

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
