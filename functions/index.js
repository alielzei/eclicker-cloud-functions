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

exports.createSession = functions.https.onRequest((req, res) => {
    id = randomID();

    // Initializing some variables for better readability
    var _title   = req.body['title'];
    var _options = req.body['options'];
    var _roomID  = req.body['roomID'];
    
    if(!(_title && _options && _roomID)){
        res.status(400);
        res.send("missing input");
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
        room: _roomID,
        results: _results,
    })
    .then((result) => {
        console.log(`new id ${id}`);
        res.send({
            msg: "Session created successfully.",
            id: id
        })
        return;
    })
    .catch((error) => {
        res.status(500);
        res.send(`err: ${JSON.stringify(error)}`);
    })
});

//This function takes a JSON file containing the ID of the session you wish to submit answers for
//and the option name, kindly check example of a correct JSON file below
// {	
//      "ID" : String,
//      "optionIndex": int
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

exports.getResults = functions.https.onRequest(async(req , res)  => {
    _sessionID = req.query['ID'];

    if(!_sessionID){
        res.status(400);
        res.send("no session id provided");
        return;
    }
    
    db.collection('sessions').doc(`${_sessionID}`).get()
    .then((snapshot) => {
        data = snapshot.data();
        res.send({
            options: data["options"],
            results: Object.values(data["results"])
        });
        return;
    })  
    .catch((err) => {
        res.status(500);
        res.send(`server error ${err}`);
        return;
    });
})

exports.getRoom = functions.https.onRequest(async (req, res) => {
    const _roomID = req.query['roomID'];

    if(!(_roomID)){
        res.status(400);
        res.send("roomID not provided");
        return;
    }

    db.collection('sessions').where('room', '==', _roomID).get()
    .then(snapshot => {
        res.send(snapshot.docs.map(doc => {
            return {
                "id": doc.id,
                "title": doc.data()['title']
            };
        }));
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(err);
        return;
    });
});

exports.createRoom = functions.https.onRequest((req, res) => {
    var _name        = req.body['name'];
    var _description = req.body['description'] || "";
    var _owner       = req.body['owner'];

    if(!(_name && _owner)){
        res.status(400);
        res.send("input missing");
        return;
    }
    
    db.collection('rooms').add({
        name: _name,
        description: _description,
        owner: _owner
    })
    .then((result) => {
        res.send({
            msg: "Room created successfully.",
        })
        return;
    })
    .catch((error) => {
        res.status(500);
        res.send(`err: ${JSON.stringify(error)}`);
        return;
    })
});

exports.joinRoom = functions.https.onRequest( async (req,res) => {
    const _userID = req.body['userID'];
    const _roomToken = req.body['roomToken']

    if(!(_userID && _roomToken)){
        res.status(400);
        res.send("userID or roomToken not provided");
        return;
    }

    try{
        userRef = db.collection('users').doc(`${_userID}`)
        roomRef = db.collection('rooms').doc(`${_roomToken}`)
        
        print(userRef.data());
        print(roomRef.data());
        
        userRef.update({
            // so this is a reference which is great
            rooms: admin.firestore.FieldValue.arrayUnion(roomRef)
        })
        roomRef.update({
            // this is a string which is great... no im serious IT IS GREAT
            participants : admin.firestore.FieldValue.arrayUnion(userRef)
        })
        res.send("you have joined the room")
    }
    catch(err){
        res.send('error in executing function')
    }

});

exports.getRoomParticipants = functions.https.onRequest(async (req, res) => {
    const _roomID = req.query['roomID'];

    if(!(_roomID)){
        res.status(400);
        res.send("roomID not provided");
        return;
    }

    db.collection('rooms').doc(`${_roomID}`).get()
    .then(async roomSnapshot => {
        participants = [];
        participantsRefs = roomSnapshot.data()["participants"];
        for(i in participantsRefs){
            participantRef = await participantsRefs[i].get();
            participants.push(participantRef.data()['name']);
        }
        res.send(participants);
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(`server error: ${err}`)
        return;
    });

});

// 1
exports.getOwnedRooms = functions.https.onRequest(async (req, res) => {
    const _userID = req.query['userID'];

    if(!(_userID)){
        res.status(400);
        res.send("userID not provided");
        return;
    }

    db.collection('rooms').where('owner', '==', _userID).get()
    .then(snapshot => {
        res.send(snapshot.docs.map(doc => {
            results = {
                "id": doc.id,
                "name": doc.data()['name'],
                "owner": doc.data()['owner']
            };
            return results;
        }));
        return; 
    })
    .catch(err => {
        res.status(500);
        res.send(`server error: ${err}`);
        return;
    });
});

// 2
exports.getJoinedRooms = functions.https.onRequest(async (req, res) => {
    const _userID = req.query['userID'];

    if(!(_userID)){
        res.status(400);
        res.send("userID not provided");
        return;
    }

    db.collection('users').doc(_userID).get()
    .then(async userSnapshot => {
        rooms = [];
        // checking which rooms the user is in
        roomsRefs = userSnapshot.data()["rooms"];
        // iterating over those references
        for(i in roomsRefs){
            // getting that reference
            roomSnapshot = await roomsRefs[i].get();
            // checking if it has data
            // maybe check for each component also
            if(roomSnapshot.data())
                // adding to the rooms list
                rooms.push({
                    "id": roomSnapshot.id,
                    "name": roomSnapshot.data()['name'],
                    "owner": roomSnapshot.data()['owner']
                });
        }
        // sending that result
        res.send(rooms);
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(`server error: ${err}`)
        return;
    });

});