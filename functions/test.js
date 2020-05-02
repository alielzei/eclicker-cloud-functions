const newId = makeid(5);
const roomRef = db.collection('rooms').doc(newId)

roomRef.get()
.then((docSnapshot) => {
    if (!docSnapshot.exists) {
        db.collection('rooms').doc(newId).set({
            name: _name,
            description: _description,
            owner: _owner,
            participants: []
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
    } else {
        
    }
});