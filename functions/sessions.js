const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
exports.createSession = functions.https.onRequest(async(req, res) => {
    // Initializing some variables for better readability
    var _title      = req.body['title'];
    var _options    = req.body['options'];
    var _timeInSecs = req.body['timeInSecs'] || 60;
    var _roomID     = req.body['roomID']

    if(!(_title && _options && _roomID)){
        res.status(400);
        res.send("title, roomID or options not provided");
        return;
    }
    var _results = {}
    for(i = 0; i < _options.length; i++){
        _results[i] = 0;
    }
    try{
        var sessionRef = db.collection('sessions').doc(`${ Math.floor(Math.random()*90000)+10000}`)
        var roomRef = db.collection('rooms').doc(`${_roomID}`)
        sessionRef.set({
            title: _title,
            options: _options,
            timeInSecs: _timeInSecs,
            results: _results,
            roomID : _roomID,
            active : false
        })
        .then((result) => {
            roomRef.update({
                sessions : admin.firestore.FieldValue.arrayUnion(`${sessionRef.id}`)
            })
            res.send({
                msg : "session created succesfully",
                id: sessionRef.id
            })
        })

    }
    catch(err){
        res.status(500);
        res.send(`err: ${JSON.stringify(error)}`);
    }
});
exports.getSession = functions.https.onRequest((req, res) => {
    const sessionID = req.body['ID'];
    if(!sessionID){
        res.status(400);
        res.send({ msg: "Session ID not provided" })
        return;
    }
    db.collection('sessions').doc(`${sessionID}`).get()
    .then((snapshot) => {
        data = snapshot.data();
        if(data)res.send(data);
        else{
            res.status(404);
            res.send("Not Found");
        }
        return;
    })
    .catch((err) => {
        console.error("getSession cloud function error");
        console.error(err)
        res.status(500);
        res.send("Error while getting the session");
    });
})

exports.setToActive = functions.https.onRequest(async(req , res)  => {
    let sessionId = req.body['ID'];
    try{    
        if(!sessionId){
            res.status(400);
            res.send({ msg: "Session ID not provided" })
            return;
        }
        const sessionRef  = db.collection('sessions').doc(`${sessionId}`);
        sessionRef.update({
            active : true
        })
        res.send("Session is now active")
        
    }
    catch(err){
        //Handle the error
        console.log("Error while executing function",err);
        res.send("Error while executing setToActive");
    }
})
exports.setToInactive = functions.https.onRequest(async(req , res)  => {
    let sessionId = req.body['ID'];
    try{    
        if(!sessionId){
            res.status(400);
            res.send({ msg: "Session ID not provided" })
            return;
        }
        const sessionRef  = db.collection('sessions').doc(`${sessionId}`);
        sessionRef.update({
            active : false
        })
        res.send("Session is now active")
        
    }
    catch(err){
        //Handle the error
        console.log("Error while executing function",err);
        res.send("Error while executing setToActive");
    }
})
exports.submitAnswer = functions.https.onRequest((req, res) => {
    var _sessionID = req.body['ID']
    var _optionIndex = req.body['optionIndex'].toString();
    if(!(_sessionID && _optionIndex)){
        res.send("missing parameters")
        return
    }
    toIncrement = {};
    toIncrement[`results.${_optionIndex}`] = admin.firestore.FieldValue.increment(1);
    const myDoc = db.collection('sessions').doc(`${_sessionID}`);
    myDoc.update(toIncrement);
    res.send('Submitted Answer');
});

//optional
exports.getResults = functions.https.onRequest(async(req , res)  => {
    let sessionId = req.body['ID'];
    try{    
        if(!sessionId){
            res.status(400);
            res.send({ msg: "Session ID not provided" })
            return;
        }
        const snapshot  = await db.collection('sessions').doc(`${sessionId}`).get();
        var data = snapshot.data();
        var result = data.results;
        if(result){
            res.send(result);
        }
        else{
            res.send("Please Check your session ID");
        }
        
    }
    catch(err){
        //Handle the error
        console.log("Error while executing function",err);
        res.send("Error while executing getResults");
    }
})
exports.showSession_host = functions.https.onRequest((req, res) => {
    const sessionID = req.body['ID'];
    if(!sessionID){
        res.status(400);
        res.send({ msg: "Session ID not provided" })
        return;
    }
    db.collection('sessions').doc(`${sessionID}`).get()
    .then((snapshot) => {
        data = snapshot.data();
        if(data){
            res.send(data['results']);
        }
        else{
            res.status(404);
            res.send("Not Found");
        }
        return;
    })
    .catch((err) => {
        console.error("getSession cloud function error");
        console.error(err)
        res.status(500);
        res.send("Error while getting the session");
    });
})
exports.showSession_respondent = functions.https.onRequest((req, res) => {
    const sessionID = req.body['ID'];
    if(!sessionID){
        res.status(400);
        res.send({ msg: "Session ID not provided" })
        return;
    }
    db.collection('sessions').doc(`${sessionID}`).get()
    .then((snapshot) => {
        data = snapshot.data();
        if(data){

            res.send({
                options : data['options'],
                title : data['title'],
                timeInSecs : data['timeInSecs']
        })}
        else{
            res.status(404);
            res.send("Not Found");
        }
        return;
    })
    .catch((err) => {
        console.error("getSession cloud function error");
        console.error(err)
        res.status(500);
        res.send("Error while getting the session");
    });
})