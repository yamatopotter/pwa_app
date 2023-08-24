const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webpush = require("web-push");
const formidable = require("formidable");
const fs = require("fs");
const UUID = require("uuid-v4");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require("./pwa_key.json");
const gcconfig = {
  projectId: "teste-d4240",
  keyFileName: "pwa_key.json",
};

const gcs = require("@google-cloud/storage")(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://teste-d4240-default-rtdb.firebaseio.com",
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    const uuid = UUID();
    const formData = new formidable.IncomingForm();
    formData.parse(request, (err, fields, files) => {
      fs.rename(files.file.path, "/tmp/" + files.file.name);
      const bucket = gcs.bucket("teste-d4240.appspot.com");

      bucket.upload(
        "/tmp/" + files.file.name,
        {
          uploadType: "media",
          metadata: {
            metadata:{
              contentType: files.file.type,
              firebaseStorageDownloadTokens: uuid,
            }
          },
        },
        function (err, file) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                rawLocation: {
                  lat: fields.rawLocationLat,
                  lng: fields.rawLocationLng
                },
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(file.name) +
                  "?alt=media&token=" +
                  uuid,
              })
              .then(function () {
                webpush.setVapidDetails(
                  "mailto:matheuspbarreto@hotmail.com.br",
                  "BL610ZNW5qPH70nUHPEB4pGWXCXgrGdtq3CzndvQng1a75-HkURz26mnBu6nuZAOizJc6ONfZOU8yAtDnP0l8Ng",
                  "557NhVI_ZugaXeU0Ut4hiujbaMi_AuqoCnOESG7Z0l8"
                );
                return admin.database().ref("subscriptions").once("value");
              })
              .then((subscriptions) => {
                subscriptions.forEach((subscription) => {
                  const pushConfig = {
                    endpoint: subscription.val().endpoint,
                    keys: {
                      auth: subscription.val().keys.auth,
                      p256dh: subscription.val().keys.p256dh,
                      openUrl: "/",
                    },
                  };

                  webpush
                    .sendNotification(
                      pushConfig,
                      JSON.stringify({
                        title: "New Post",
                        content: "New post added!",
                      })
                    )
                    .catch((err) => console.log(err));
                });

                response
                  .status(201)
                  .json({ message: "Data stored", id: fields.id });
              })
              .catch(function (err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err)
          }
        }
      );
    });
  });
});
