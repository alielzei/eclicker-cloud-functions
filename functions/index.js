const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eclicker-1.firebaseio.com"
});

const db = admin.firestore();

//function that creates a session
exports.createSession = functions.https.onRequest(async(req, res) => {
    //Initializing some variables for better readability
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
        res.send(`Session Crated Succesfuly!\n Your session ID is ${ID}.`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })

});

//Function that takes a JSON File containing the ID of a session and Retrieves it
exports.getSession = functions.https.onRequest(async (req,res)=>{
    try{
        const sessionId = req.query['ID'];
        const snapshot  = await db.collection('sessions').doc(`${sessionId}`).get();
        const data = snapshot.data()
        if(data){
            res.send(data);
        }
        else{
            res.send("Please Check your session ID");
        }
    }
    catch(err){
        //Handle the error
        console.log("Error while executing function",err);
        res.send("Error while getting the quiz");
    }
})

//Helper Function that increments submissions field in session 1 by 1
//This is for testing only
exports.updateSubmits = functions.https.onRequest((req, res) => {
    try{
        const storyRef = db.collection('sessions').doc('0');
        storyRef.update({ submits: admin.firestore.FieldValue.increment(1) })
        res.send("Your results were submited !");
    }
    catch(err){
        console.log("Error executing update function",err)
        res.send("Error executing function");
    }
    })
