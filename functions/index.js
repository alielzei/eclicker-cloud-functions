const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
let FieldValue = require('firebase-admin').firestore.FieldValue;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eclicker-1.firebaseio.com"
});
const db = admin.firestore();

// 1
exports.getHostedRooms = functions.https.onRequest(async (req, res) => {
    const _userID = req.query['user'];

    if(_userID == undefined){
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
    const _userID = req.query['user'];

    if(_userID == undefined){
        res.status(400);
        res.send("userID not provided");
        return;
    }

    db.collection('users').doc(_userID).get()
    .then(async userSnapshot => {
        roomsRefs = userSnapshot.data()["rooms"];
        Promise.all(
            roomsRefs.map(r => r.get())
        )
        .then((roomSnapshots) => {
            res.send(roomSnapshots
            .filter(snapshot => snapshot.exists)
            .map(s => {
                return {
                    "id": s.id,
                    "name": s.data()['name'],
                    "owner": s.data()['owner']
                }
            }
            ));
            return;
        });
    })
    .catch(err => {
        res.status(500);
        res.send(`server error: ${err}`)
        return;
    });

});

// 3
exports.createRoom = functions.https.onRequest((req, res) => {
    var _name        = req.body['name'];
    var _description = req.body['description'] || "";
    var _owner       = req.body['user'];

    if([_name, _owner].some(e => e == undefined)){
        res.status(400);
        res.send("input missing");
        return;
    }
    
    db.collection('rooms').add({
        name: _name,
        description: _description,
        owner: _owner
    })
    .then((roomRef) => {
        res.send({
            "id": roomRef.id,
            "name": _name,
            "owner": _owner
        })
        return;
    })
    .catch((error) => {
        res.status(500);
        res.send(`err: ${JSON.stringify(error)}`);
        return;
    })
});

// 4
exports.joinRoom = functions.https.onRequest( async (req,res) => {
    const _userID = req.body['user'];
    const _token = req.body['token']

    if([_userID, _token].some(e => e == undefined)){
        res.status(400);
        res.send("userID or roomToken not provided");
        return;
    }

    roomRef = db.collection('rooms').doc(`${_token}`);
    userRef = db.collection('users').doc(`${_userID}`);
    roomSnapshot = await roomRef.get();

    // check if not owner
    
    if(!roomSnapshot.exists){
        res.status(404);
        res.send('Room not found');
        return;
    }

    Promise.all([
        userRef.update({
            rooms: admin.firestore.FieldValue.arrayUnion(roomRef)
        }),
        roomRef.update({
            participants: admin.firestore.FieldValue.arrayUnion(userRef)
        }),
    ])
    .then(() => {
        res.send({
            "id": roomRef.id,
            "name": roomSnapshot.data()['name'],
            "owner": roomSnapshot.data()['owner']
        });
    })
    .catch(err => {
        res.status(500);
        res.send(`server error: ${err}`)
    })
});

// 5
exports.getSessions = functions.https.onRequest(async (req, res) => {
    const _room = req.query['room'];

    if(_room == undefined){
        res.status(400);
        res.send("room not provided");
        return;
    }

    db.collection('sessions').where('room', '==', _room).get()
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

// 6
exports.getParticipants = functions.https.onRequest(async (req, res) => {
    const _room = req.query['room'];

    if(_room == undefined){
        res.status(400);
        res.send("room not provided");
        return;
    }

    db.collection('rooms').doc(`${_room}`).get()
    .then(roomSnapshot => {
        if(!roomSnapshot.exists){
            res.status(404);
            res.send("room not found");
            return;
        }

        participantsRefs = roomSnapshot.data()["participants"];
        Promise.all(
            participantsRefs.map(ref => ref.get())
        )
        .then(values => {
            res.send(values.map(snapshot => snapshot.data()['name']))
            return;
        })
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(`server error: ${err}`)
        return;
    });

});

// 7
exports.createSession = functions.https.onRequest((req, res) => {
    // Initializing some variables for better readability
    var _roomID  = req.body['room'];
    var _title   = req.body['title'];
    var _options = req.body['options'];
    
    if([_roomID, _title, _options].some(e => e == undefined)){
        res.status(400);
        res.send("missing input");
        return;
    }

    db.collection('sessions')
    .add({
        title: _title,
        options: _options,
        room: _roomID,
    })
    .then((result) => {
        res.send('session created');
        return;
    })
    .catch((error) => {
        res.status(500);
        res.send(`err: ${error}`);
    })
});

// 8
exports.getActiveSessions = functions.https.onRequest(async (req, res) => {
    const _room = req.query['room'];

    if(_room == undefined){
        res.status(400);
        res.send("room not provided");
        return;
    }

    db.collection('sessions')
    .where('room', '==', _room)
    .get()
    .then(snapshot => {
        result = snapshot.docs
        .filter(doc => {
            return doc.data()['results'] 
            // && doc.data()['respondent'].contains('userID')
        })
        .map(doc => ({
            "id": doc.id,
            "title": doc.data()['title']
        }));
        res.send(result);
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(err);
        return;
    });

});

// 9
exports.getSession = functions.https.onRequest((req, res) => {
    const session = req.query['session'];

    if(session == undefined){
        res.status(400);
        res.send({ msg: "session not provided" })
        return;
    }

    db.collection('sessions')
    .doc(`${session}`).get()
    .then(snapshot => {
        data = snapshot.data();
        if(data){
            res.send({
                title: data.title,
                options: data.options
            });
        }
        else{
            res.status(404);
            res.send("Not Found");
        }
        return;
    })
    .catch((err) => {
        res.status(500);
        res.send(`server error: ${err}`);
    });

})

// 10
exports.submitAnswer = functions.https.onRequest((req, res) => {
    const _session = req.body['session'];
    const _option = req.body['option'];
    
    if([_session, _option].some(e => e == undefined)){
        res.status(400);
        res.send("missing input");
        return;
    }

    toIncrement = {};
    toIncrement[`results.${_option}`] = admin.firestore.FieldValue.increment(1);

    db.collection('sessions').doc(`${_session}`)
    .update(toIncrement)
    .then(() => {
        res.send('success');
        return;
    })
    .catch((err) => {
        res.status(500);
        res.send(`server error: ${err}`);
        return;
    });
});

// 11
exports.activateSession = functions.https.onRequest(async (req, res) => {
    const _session = req.body['session'];

    sessionRef = db.collection('sessions').doc(`${_session}`);

    sessionSnapshot = await sessionRef.get()
    results = {}
    for(i = 0; i < sessionSnapshot.data()['options'].length; i++)
        results[i] = 0;

    sessionRef
    .update({
        results: results,
    })
    .then(() => {
        res.send('success');
        return;
    })
    .catch((err) => {
        res.status(500);
        res.send(`server error: ${err}`);
        return;
    });
    
});

// 12
exports.deactivateSession = functions.https.onRequest(async (req, res) => {
    const _session = req.body['session'];

    sessionRef = db.collection('sessions').doc(`${_session}`);
    sessionSnapshot = await sessionRef.get();

    if(sessionSnapshot.data()['results'] == undefined){
        res.status(400);
        res.send('session was not active');
        return;
    }

    try{
        result = sessionSnapshot.data();
        result.session = sessionSnapshot.id;
        result.time = FieldValue.serverTimestamp();
        await db.collection('history')
        .add(result);
    }
    catch(err){
        res.status(500);
        res.send(`server error: ${err}`);
        return;
    }

    sessionRef
    .update({
        results: admin.firestore.FieldValue.delete()
    })
    .then(() => {
        res.send('success');
        return;
    })
    .catch((err) => {
        res.status(500);
        res.send(`server error: ${err}`);
        return;
    });

});

// 13
exports.getHistory = functions.https.onRequest(async (req, res) => {
    const _room = req.query['room'];

    if(_room == undefined){
        res.status(400);
        res.send("room not provided");
        return;
    }

    db.collection('history')
    .orderBy('time','asc')
    .where('room', '==', _room).get()
    .then(snapshot => {
        res.send(
            snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data()['title'],
                time: doc.data()['time'].toDate().toLocaleString()
            }))
        );
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(err);
        return;
    });
});

// 14
exports.getResults = functions.https.onRequest(async (req, res) => {
    const _session = req.query['session'];

    if(_session == undefined){
        res.status(400);
        res.send("session not provided");
        return;
    }

    db.collection('history').doc(_session).get()
    .then(snapshot => {
        res.send(snapshot.data())
    })
    .catch(err => {
        res.status(500);
        res.send(err);
        return;
    });
});

// 15
exports.deleteHistory = functions.https.onRequest(async(req,res)=>{
    var history = req.body["history"];

    if(history == undefined){
        res.status(400);
        res.send('missing input');
        return;
    }

    db.collection('history').doc(`${history}`).delete()
    .then(result => {
        res.status(200);
        res.send('success');
        return;
    })
    .catch(err => {
        res.status(500);
        res.send(err);
        return;
    });
})

// 16
exports.deleteSession = functions.https.onRequest(async(req,res)=>{
    var session = req.body["session"];

    if(session == undefined){
        res.status(400);
        res.send('missing input');
        return;
    }

    db.collection('sessions').doc(`${session}`).delete()
    .then(result => {
        res.status(200)
        res.send('success');
        return;
    })
    .catch(err=>{
        res.status(500)
        res.send(err)
        return;
    });
})

// 17
exports.getUser = functions.https.onRequest((req, res) => {
    const user = req.query['user'];

    if(user == undefined){
        res.status(400);
        res.send({ msg: "user not provided" })
        return;
    }

    db.collection('users')
    .doc(`${user}`).get()
    .then(snapshot => {
        data = snapshot.data();
        if(data){
            res.send({
                name: data.name,
                email: data.email,
                rooms: data.rooms
            });
        }
        else{
            res.status(404);
            res.send("Not Found");
        }
        return;
    })
    .catch((err) => {
        res.status(500);
        res.send(`server error: ${err}`);
    });

})

// 18
exports.createSessionFromParsedData = functions.firestore.document('parsed/{parsedID}').onCreate((snap, context) => {
      // Get an object representing the document
      // e.g. {'title': 'myTitle', 'roomID': "1234", options: "{op1,op2,op3}"}
      const newValue = snap.data();

      // access a particular field as you would any JS property
      const _title = newValue.title;
      const _room = newValue.roomID;
      var _string = newValue.options; 
      var _options = _string.split(',');
      console.log(_title);
      console.log(_room);
      console.log(_options);

      // perform desired operations ...
    db.collection('sessions')
    .add({
        title: _title,
        options: _options,
        room: _room,
    })
    .then((result) => {
        res = 'session created';
        console.log(res);
        return res ;
    })
    .catch((error) => {
        res.status(500);
        res.send(`err: ${error}`);
    })
  return true
});

// 19
exports.helper = functions.https.onRequest((req, res) => {
  // Initializing some variables for better readability
  var _roomID  = req.body['room'];
  var _title   = req.body['title'];
  var _options = req.body['options'];

  if(![_roomID, _title, _options]){
      res.status(400);
      res.send("missing input");
      return;
  }
  db.collection('parsed')
  .add({
      title: _title,
      options: _options,
      room: _roomID,
  })
  .then((result) => {
      res.send('created');
      return;
  })
  .catch((error) => {
      res.status(500);
      res.send(`err: ${error}`);
  })
  
});

// 20
exports.deleteRoom = functions.https.onRequest(async(req,res)=>{
    var room = req.body["room"];

    if(room == undefined){
        res.status(400);
        res.send('missing input');
        return;
    }

    await db.collection('sessions')
    .where('room','==', room)
    .get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        doc.ref.delete();
      });
    });

    db.collection('rooms').doc(`${room}`)
    .delete()
    .then(r => {
        res.status(200)
        res.send('success');
        return;
    })
    .catch(err=>{
        res.status(500)
        res.send(err)
        return;
    });
})