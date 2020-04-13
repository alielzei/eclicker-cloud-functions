const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

exports.createRoom = functions.https.onRequest(async(req, res) => {
    var _name        = req.body['name'];
    var _description = req.body['description'] || "";
    var _ownerID    = req.body['ownerID']
    if(!(_name && _ownerID)){
        res.status(400);
        res.send("name or ownerID not provided");
        return;
    }
    try{
        roomRef = db.collection('rooms').doc(`${ Math.floor(Math.random()*90000)+10000}`)
        userRef = db.collection('users').doc(`${_ownerID}`)
        roomRef.set({
            name: _name,
            description: _description,
            ownerID: _ownerID,
            token : roomRef.id,
            participants : [],
            sessions : []
        })
        .then((result) => {
            userRef.update({
                hostingRooms : admin.firestore.FieldValue.arrayUnion(`${roomRef.id}`)
            })
            res.send({
                msg: "Room created successfully.",
            })
            return;
        })       
    }
    catch(err){
        res.status(500);
        res.send(`err: ${JSON.stringify(error)}`);

    }
});
exports.getRoom = functions.https.onRequest(async (req, res) => {
    const _roomID = req.body['roomID'];
    if(!(_roomID)){
        res.status(400);
        res.send("roomID not provided");
        return;
    }
    var roomRef = db.collection('rooms').doc(`${_roomID}`);
    try{
        roomRef.get()
        .then(snapshot=>{
            res.send(snapshot.data())
            })
    }
    catch(err){
        res.status(500);
        res.send(err);
    }
});
exports.getRoomParticipants = functions.https.onRequest(async (req, res) => {
    const _roomID = req.body['roomID'];
    if(!(_roomID)){
        res.status(400);
        res.send("roomID not provided");
        return;
    }
    var roomRef = db.collection('rooms').doc(`${_roomID}`);
    try{
        roomRef.get()
        .then(snapshot=>{
            const data = snapshot.data()['participants']
            res.send(data)
            })
    }
    catch(err){
        res.status(500);
        res.send(err);
    }
});
exports.getRoomSessions = functions.https.onRequest(async (req, res) => {
    const _roomID = req.body['roomID'];
    if(!(_roomID)){
        res.status(400);
        res.send("roomID not provided");
        return;
    }
    var roomRef = db.collection('rooms').doc(`${_roomID}`);
    try{
        roomRef.get()
        .then(snapshot=>{
            const data = snapshot.data()['sessions']
            res.send(data)
            })
    }
    catch(err){
        res.status(500);
        res.send(err);
    }
});
exports.getRoomToken = functions.https.onRequest(async (req, res) => {
    const _roomID = req.body['roomID'];
    if(!(_roomID)){
        res.status(400);
        res.send("roomID not provided");
        return;
    }
    var roomRef = db.collection('rooms').doc(`${_roomID}`);
    try{
        roomRef.get()
        .then(snapshot=>{
            const data = snapshot.data()['token']
            res.send(data)
            })
    }
    catch(err){
        res.status(500);
        res.send(err);
    }
});