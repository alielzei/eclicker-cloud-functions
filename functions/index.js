const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eclicker-1.firebaseio.com"
});
const db = admin.firestore();

//Start writing functions
exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send("Hello from Firebase!");
});

exports.createSession = functions.https.onRequest((req, res) => {

    var title = req.body['title'] || "untitled";
    var options = req.body['options'] || [];
    var correct = req.body['correct'] || [];
    var time = req.body['timeInSecs'] || 0;
    var results = req.body['results'] || [0,0,0,0];
    ID = '8';
    db.collection('sessions').doc(ID).set({
        title: title,
        options: options,
        correct: correct,
        timeInSecs: time,
        results: [ 0, 0, 0 ] 
    }).then((result) => {
        res.send(`success ${JSON.stringify(result)}`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })
});