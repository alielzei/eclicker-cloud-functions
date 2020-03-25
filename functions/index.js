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
 req.send("Hello from Firebase!");
});

exports.createSession = functions.https.onRequest((req, res) => {
    // the template
    db.collection('sessions').doc('5').set({
        title: 'test placeholder',
        options: ['opt1', 'opt2', 'opt3'],
        // indexes of the correct answers in options
        correct: [0, 1],
        timeInSecs: 0,
        // the submissions of each option
        results: [ 0, 0, 0 ] 
    })

    res.send('done')
});

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