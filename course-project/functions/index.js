const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webpush = require("web-push");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require("./pwa_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://teste-d4240-default-rtdb.firebaseio.com",
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(function () {
        webpush.setVapidDetails(
          "mailto:matheuspbarreto@hotmail.com.br",
          "BOBTLKBzVfcjGVFCGjI9Mu3VqqfWbzB37_hot4ZOq-FDV1bokH4uW0OSkV582IIUDt5r0MHnwXO90Q0VunLsgB4",
          "nL2K3wKy_KlB6wcv6bHtOs - x - _vmEku4YCMbYrU1b0Q"
        );
        return admin.database().ref("subscriptions").once("value");
      })
      .then((subscriptions)=>{
        subscriptions.forEach((subscription)=>{
          const pushConfig = {
            endpoint: subscription.val().endpoint,
            keys: {
              auth:subscription.val().keys.auth,
              p256dh: subscription.val().keys.p256dh
            }
          }

          webpush.sendNotification(pushConfig, JSON.stringify({title: "New Post", content: "New post added!"}))
          .catch(err=>console.log(err));
        })
        
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  });
});
