const functions = require('firebase-functions');
const app = require('express')();
const admin = require('firebase-admin');

const cors = require('cors');

const {
    sendEmail,
    sendCampaign
} = require('./handlers/emailActions');

const {
    unsubscribeFromNewsletter
} = require('./handlers/userActions');


const serviceAccount = require("./handlers/constants/firebase-adminsdk-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://liberty-academy.firebaseio.com"
});

app.use(cors());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/sendEmail', sendEmail);
app.post('/sendCampaign', (req, res) => sendCampaign(req, res, admin));
// app.get('/unsubscribe/:id', (req, res) => unsubscribeFromNewsletter(req, res, admin));

exports.api = functions.https.onRequest(app);