const sharedMomentsArea = document.querySelector("#shared-moments");
const shareImageButton = document.querySelector("#share-image-button");
const createPostArea = document.querySelector("#create-post");
const closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
const form = document.querySelector("form");
const titleInput = document.querySelector("#title");
const locationInput = document.querySelector("#location");
const videoPlayer = document.querySelector("#player");
const canvasElement = document.querySelector("#canvas");
const captureButton = document.querySelector("#capture-btn");
const imagePicker = document.querySelector("#image-picker");
const imagePickerArea = document.querySelector("#pick-image");
const locationBtn = document.querySelector("#location-btn");
const locationLoader = document.querySelector("#location-loader");
let picture;
let fetchedLocation = {lat: 0, lng:0};

locationBtn.addEventListener("click", (event) => {
  let sawAlert = false;
  if (!("geolocation" in navigator)) {
    return;
  }

  locationBtn.style.display = "none";
  locationLoader.style.display = "block";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      fetchedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      locationInput.value = "test location";
      document.querySelector("#manual-location").classList.add("is-focused");
    },
    (err) => {
      console.log(err);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      if(!sawAlert){
        sawAlert = true;
        alert("Coundn't fetch locaation, please enter manually.");
      }
      fetchedLocation = {
        lat: 0,
        lng: 0,
      };
    },
    {
      timeout: 7000,
    }
  );
});

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    location.style.display = "none";
  }
}

function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = (constraints) => {
      const getUserMedia =
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not available"));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoPlayer.stream = stream;
      videoPlayer.style.display = "block";
    })
    .catch((err) => (imagePickerArea.style.display = "block"));
}

captureButton.addEventListener("click", (event) => {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";

  const context = canvasElement.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvasElement.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width)
  );

  videoPlayer.srcObject.getVideoTracks().forEach((track) => track.stop());
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener("change", (event) => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  // createPostArea.style.display = "block";
  setTimeout(() => {
    createPostArea.style.transform = "translateY(0)";
  }, 50);
  initializeMedia();
  initializeLocation();
  // Abrir a popup para instalar o software caso não tenha instalado
  // if (deferredPrompt) {
  //   deferredPrompt.prompt();

  //   deferredPrompt.userChoice.then((c) => {
  //     console.log(c.outcome);

  //     if (c.outcome === "dismissed") {
  //       console.log("User cancelled installation");
  //     } else {
  //       console.log("User added to homescreen");
  //     }
  //   });

  //   deferredPrompt = null;
  // }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
  captureButton.style.display = "inline";

  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach((track) => track.stop());
  }
  setTimeout(() => {
    createPostArea.style.transform = "translateY(100vh)";
  }, 50);
}

shareImageButton.addEventListener("click", openCreatePostModal);
closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Allow save data on demmand in cache
function onSaveButtonClicked(event) {
  console.log("Clicked");
  if ("caches" in window) {
    caches.open("user-request").then((cache) => {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  let cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  let cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url('${data.image}')`;
  cardTitle.style.backgroundSize = "cover";
  cardWrapper.appendChild(cardTitle);
  let cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  let cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  // let cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener("click", onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

const url = "https://teste-d4240-default-rtdb.firebaseio.com/posts.json";
let networkDataReceived = false;

fetch(url)
  .then((res) => {
    return res.json();
  })
  .then((data) => {
    networkDataReceived = true;
    console.log("From Web", data);
    let dataArray = [];
    for (let key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ("indexedDB" in window) {
  readAllData("posts").then((data) => {
    if (!networkDataReceived) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

function sendData() {
  const postData = new FormData();
  const id = new Date.toISOString();
  postData.append("id", id);
  postData.append("title", titleInput.value);
  postData.append("location", locationInput.value);
  postData.append("rawLocationLng", fetchedLocation.lng);
  postData.append("rawLocationLat", fetchedLocation.lat);
  postData.append("file", picture, id + ".png");

  fetch("https://us-central1-teste-d4240.cloudfunctions.net/storePostData", {
    method: "POST",
    body: postData,
  }).then((res) => {
    console.log("Sent data", res);
    updateUI();
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("Please, enter a valid data.");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((sw) => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation,
      };
      writeData("sync-posts", post)
        .then(() => sw.sync.register("sync-new-posts"))
        .then(() => {
          const snackbarContainer = document.querySelector(
            "#confirmation-toast"
          );
          const data = { message: "Your post was saved for syncing" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => console.log(err));
    });
  } else {
    sendData();
  }
});
