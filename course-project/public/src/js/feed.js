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
let picture;

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

function openCreatePostModal() {
  // createPostArea.style.display = "block";
  createPostArea.style.transform = "translateY(0)";
  initializeMedia();
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
  createPostArea.style.transform = "translateY(100vh)";
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  // createPostArea.style.display = "none";
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
  let postData = new FormData();
  postData.append("id", new Date.toISOString());
  postData.append("title", titleInput.title);
  postData.append("location", locationInput.location);
  postData.append("file", post.picture, post.id + ".png");

  fetch("https://us-central1-teste-d4240.cloudfunctions.net/storePostData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: new Date.toISOString(),
      image:
        "https://firebasestorage.googleapis.com/v0/b/teste-d4240.appspot.com/o/sf-boat.jpg?alt=media&token=25586f70-6b19-480d-ab4b-f08104f528a1",
      title: titleInput.value,
      location: locationInput.value,
    }),
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
