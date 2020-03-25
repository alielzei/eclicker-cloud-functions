const functions = require('firebase-functions');

const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eclicker-1.firebaseio.com"
});

const db = admin.firestore();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send("Hello from Firebase!");
});

exports.createSession = functions.https.onRequest((req, res) => {

    console.log(req.body);

    // res.send(JSON.stringify(req.body));

    var title = req.body['title'] || "untitled";
    var options = req.body['options'] || [];
    var correct = req.body['correct'] || [];

    ID = '6';

    db.collection('sessions').doc(ID).set({
        title: title,
        options: options,
        // indexes of the correct answers in options
        correct: correct,
        timeInSecs: 0,
        // the submissions of each option
        results: [ 0, 0, 0 ] 
    }).then((result) => {
        res.send(`success ${JSON.stringify(result)}`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })

});

// READ ALL SESSIONS FROM FIRESTORE
// db.collection('sessions').get()
    // .then((snapshot) => {
    //   snapshot.forEach((doc) => {
    //     console.log(doc.id, '=>', doc.data());
    //   });
    //   res.send('ok');
    // })
    // .catch((err) => {
    //   console.log('Error getting documents', err);
    //   res.send('err');
    // });