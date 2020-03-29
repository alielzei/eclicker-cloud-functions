exports.createSession = functions.https.onRequest(async(req, res) => {
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
    sessionRef = db.collection('sessions').doc(`${ID}`)
    ID = size+1;
    data = {
            title: _title,
            options: _options,
            correct: _correct,
            timeInSecs: _timeInSecs,
    }
    for(var i = 0;i<_optionsNumber;i++){
        sessionRef.set({option1 : 0})
    }
    sessionRef.set(data).then((result) => {
        res.send(`Session Crated Succesfuly!\n Your session ID is ${ID}.`);
    }).catch((error) => {
        res.send(`err: ${JSON.stringify(error)}`);
    })

});