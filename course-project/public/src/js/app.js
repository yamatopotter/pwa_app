var deferredPrompt;
const enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(() => {
      console.log("Service worker registered.");
    })
    .catch((err) => console.log(err));
}

window.addEventListener("beforeinstallprompt", (event) => {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

const displayConfirmNotification = () => {
  if ("serviceWorker" in navigator) {
    const options = {
      body: "You successfully subscribed to our Notification service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boa.jpg",
      dir: "ltr",
      lang: "en-US",
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "OK",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    };

    navigator.serviceWorker.ready.then((swreg) => {
      swreg.showNotification("Sucessfully subscribed", options);
    });
  }
};

const askForNotificationsPermission = () => {
  Notification.requestPermission((result) => {
    console.log("User choice", result);
    if (result !== "granted") {
      console.log("No notification permission granted!");
    } else {
      configurePushSub();
    }
  });
};

if ("Notification" in window) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationsPermission
    );
  }
}

const configurePushSub = () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let reg;

  navigator.serviceWorker.ready
    .then((swreg) => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        const vapidKey =
          "BL610ZNW5qPH70nUHPEB4pGWXCXgrGdtq3CzndvQng1a75-HkURz26mnBu6nuZAOizJc6ONfZOU8yAtDnP0l8Ng";
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      }
      else{
        alert("Subscription we have")
      }
    })
    .then((newsub) => {
      return fetch(
        "https://teste-d4240-default-rtdb.firebaseio.com/subscriptions.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newsub),
        }
      );
    })
    .then((res) => {
      console.log(res)
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch((err) => console.log(err));
};

// navigator.serviceWorker.getRegistrations().then(function (registrations) {
//   for (let registration of registrations) {
//     registration.unregister();
//   }
// });
