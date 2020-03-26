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
//function that creats a session
exports.createSession = functions.https.onRequest(async(req, res) => {
    //Initilizing some variables for better readability
    var _title = req.body['title'] || "untitled";
    var _options = req.body['options'] || [];
    var _correct = req.body['correct'] || [];
    var _timeInSecs = req.body['timeInSecs'] || 0;
    //optionsNumber holds the number that represents how many options you have
    var optionsNumber = _options.length;
    //this array will hold the results, it's initilized to 0s
    var _results = [];
    for(var i = 0; i < optionsNumber; i++) {
        _results.push(0);
    }
    //Here I am using try and catch to force createSession function to wait
    //untill the data is fetched (here size of my collection) from my database before proceeding
    try{
        await db.collection('sessions').get().then(snap => {
            size = snap.size // will return the collection size
        });
    }
    catch(err){
        console.log(err);
    }
    //Without putting try and catch the function will fail here cause it will not get the type of size variable
    ID = size+1;
    db.collection('sessions').doc(`${ID}`).set({
        title: _title,
        options: _options,
        correct: _correct,
        timeInSecs: _timeInSecs,
        results: _results,
    }).then((result) => {
        res.send(`success ${JSON.stringify(result)}`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })

});