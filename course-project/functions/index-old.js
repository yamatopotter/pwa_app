/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { admin } = require("firebase-admin");
const cors = require("cors")({ origin: true });
const serviceAccount = require("./pwa_key.json");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://teste-d4240-default-rtdb.firebaseio.com",
});

exports.storePostData = onRequest((request, response) => {
  cors(request, response, function (){
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(() => {
        response
          .status(201)
          .json({ message: "data stored", id: request.body.id });
      })
      .catch((err) => response.status(500).json({ error: err }));
  });
});
