var deferredPrompt;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() =>{
    console.log("Service worker registered.");
  })
  .catch((err) => console.log(err));
}

window.addEventListener("beforeinstallprompt", (event) => {
    console.log("beforeinstallprompt fired");
    event.preventDefault();
    deferredPrompt = event;
    return false;
})

    // navigator.serviceWorker.getRegistrations().then(function (registrations) {
    //   for (let registration of registrations) {
    //     registration.unregister();
    //   }
    // });