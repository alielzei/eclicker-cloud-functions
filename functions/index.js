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
    var _title = req.body['title'];
    var _options = req.body['options'];
    var _correct = req.body['correct'];
    var _timeInSecs = req.body['timeInSecs'];
    try{
        if(!(req.body['title'] && req.body['options'] && req.body['correct'] && req.body['timeInSecs'] )){
            res.send("Request Failed! few parameters.");
            return
        }
    }
    catch(err){
        res.send("Error happened");
        console.log(err);
    }
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
    data = {
            title: _title,
            options: _options,
            correct: _correct,
            timeInSecs: _timeInSecs,
            results : _results,
    }
    db.collection('sessions').doc(`${ID}`).set(data).then((result) => {
        res.send(`Session Crated Succesfuly!\n Your session ID is ${ID}.`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })

});
//Function that takes a JSON File containing the ID of a session and Retrieves it
exports.getSession = functions.https.onRequest(async (req,res)=>{
    try{
        const sessionId = req.body['ID'];
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

//This function takes a JSON file containing the ID of the session you wish to submit answers for
//and the option name, kindly check example of a correct JSON file below
// {	"ID" : 0,
// 	"optionName" : "option1"
// }
exports.updateResults = functions.https.onRequest((req, res) => {
    var _SessionID = req.body['ID']
    var _optionName = req.body['optionName'];
    try{
        const sessionRef = db.collection('sessions').doc(`${_SessionID}`);
        sessionRef.update( `${_optionName}`,require('firebase-admin').firestore.FieldValue.increment(1));
        res.send("Your results were submited !");
    }
    catch(err){
        console.log("Error executing update function",err)
        res.send("Error executing function");
    }
    })

//I'm trying to create fields to hold the results, for each option one field
exports.testCreateSession = functions.https.onRequest(async(req, res) => {
    //Initilizing some variables for better readability
    var _title = req.body['title'] || "How many days is there in a week ?";
    var _options = req.body['options'] || ["3","5","7"];
    var _correct = req.body['correct'] || [1];
    var _timeInSecs = req.body['timeInSecs'] || 30;
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
    ID = size+1;
    sessionRef = db.collection('sessions').doc(`${ID}`);
    data = {
            title: _title,
            options: _options,
            correct: _correct,
            "timeInSecs": _timeInSecs,
    }
    for(var i = 0;i<optionsNumber;i++){
        var name = "option1"
        sessionRef.set({"option1" : 0},{merge:true})
    }
    sessionRef.set(data).then((result) => {
        res.send(`Session Crated Succesfuly!\n Your session ID is ${ID}.`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })

});