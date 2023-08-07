var sharedMomentsArea = document.querySelector("#shared-moments");
var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);

function openCreatePostModal() {
  createPostArea.style.display = "block";
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
  createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);
closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function createCard() {
  let cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  let cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url('src/images/sf-boat.jpg')";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  let cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = "San Francisco Trip";
  cardTitle.appendChild(cardTitleTextElement);
  let cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = "In San Francisco";
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

fetch("https://httpbin.org/get")
  .then((res) => {
    return res.json;
  })
  .then((data) => createCard());
