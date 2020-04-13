const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

exports.getUSer = functions.https.onRequest(async (req, res) => {
    const _userID = req.body['userID'];
    if(!(_userID)){
        res.status(400);
        res.send("userID not provided");
        return;
    }
    var roomRef = db.collection('users').doc(`${_userID}`);
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
exports.getHostingRooms = functions.https.onRequest(async (req, res) => {
    const _userID = req.body['userID'];
    if(!(_userID)){
        res.status(400);
        res.send("userID not provided");
        return;
    }
    var roomRef = db.collection('users').doc(`${_userID}`);
    try{
        roomRef.get()
        .then(snapshot=>{
            const data = snapshot.data()['hostingRooms']
            res.send(data)
            })
    }
    catch(err){
        res.status(500);
        res.send(err);
    }
});
exports.getParticipatingRooms = functions.https.onRequest(async (req, res) => {
    const _userID = req.body['userID'];
    if(!(_userID)){
        res.status(400);
        res.send("userID not provided");
        return;
    }
    var roomRef = db.collection('users').doc(`${_userID}`);
    try{
        roomRef.get()
        .then(snapshot=>{
            const data = snapshot.data()['participatingRooms']
            res.send(data)
            })
    }
    catch(err){
        res.status(500);
        res.send(err);
    }
});
exports.enrolInRoom = functions.https.onRequest(async(req,res)=>{
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
        userRef.update({
            participatingRooms : admin.firestore.FieldValue.arrayUnion(`${roomRef.id}`)
        })
        roomRef.update({
            participants : admin.firestore.FieldValue.arrayUnion(`${userRef.id}`)
        })
        res.send("you have joind the room")
    }
    catch(err){
        res.send('error in executing function')
    }

})