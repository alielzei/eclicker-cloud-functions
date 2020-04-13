const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eclicker-1.firebaseio.com"
});

const db = admin.firestore();

exports.users = require('./users');
exports.rooms = require('./rooms');
exports.sessions = require('./sessions');
