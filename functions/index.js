const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eclicker-1.firebaseio.com"
});

const db = admin.firestore();

// NEED TO FIND A BETTER WAY TO GENERATE SESSION ID
function randomID(){
	return Math.floor(Math.random()*90000)+10000;
}

//Function that takes a JSON File containing the ID of a session and Retrieves it
exports.getSession = functions.https.onRequest((req, res) => {
    const sessionID = req.query['ID'];
    if(!sessionID){
        res.status(400);
        res.send({ msg: "Session ID not provided" })
        return;
    }
    db.collection('sessions').doc(`${sessionID}`).get()
    .then((snapshot) => {
        data = snapshot.data();
        if(data) res.send(data);
        else{
            res.status(404);
            res.send("Not Found");
        }
    })
    .catch((err) => {
        console.error("getSession cloud function error");
        console.error(err)
        res.status(500);
        res.send("Error while getting the session");
    });
})

exports.createSession = functions.https.onRequest((req, res) => {
    id = randomID();

    // Initializing some variables for better readability
    var _title      = req.body['title'];
    var _options    = req.body['options'];
    var _correct    = req.body['correct']    || [];
    var _timeInSecs = req.body['timeInSecs'] || 60;

    if(!(_title && _options)){
        res.status(400);
        res.send("title or options not provided");
        return;
    }
    
    var _results = {}
    for(i = 0; i < _options.length; i++){
        _results[i] = 0;
    }

    // NEED TO CHECK IF ID ALREADY EXISTS
    db.collection('sessions').doc(`${id}`)
    .set({
        title: _title,
        options: _options,
        correct: _correct,
        timeInSecs: _timeInSecs,
        results: _results,
    })
    .then((result) => {
        console.log(`new id ${id}`);
        res.send({
            msg: "Session created successfully.",
            id: id
        })
    })
    .catch((error) => {
        res.status(500);
        res.send(`err: ${JSON.stringify(error)}`);
    })
});

//This function takes a JSON file containing the ID of the session you wish to submit answers for
//and the option name, kindly check example of a correct JSON file below
// {	"ID" : String,
// 	    "optionIndex": int
// }
exports.submitAnswer = functions.https.onRequest((req, res) => {
    var _sessionID = req.body['ID']
    var _optionIndex = req.body['optionIndex'].toString();

    toIncrement = {};
    toIncrement[`results.${_optionIndex}`] = admin.firestore.FieldValue.increment(1);

    const myDoc = db.collection('sessions').doc(`${_sessionID}`);
    myDoc.update(toIncrement);
    res.send('Submitted Answer');
});