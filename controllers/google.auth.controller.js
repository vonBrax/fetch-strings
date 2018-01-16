const fs = require('fs'),
    path = require('path'),
    readline = require('readline'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library'),
    config = require('../config/google.config');

const SCOPES = config.SCOPES,
  TOKEN_DIR = config.TOKEN_DIR,
  TOKEN_PATH = config.TOKEN_PATH;

// Path to target file (funnel configuration file)
// const funnelPath = path.join(__dirname, '../dynamic-funnel/src/app/models/bariatric.ts');

// Construct funnel using chosen language
// const chosenLanguage = process.argv[2] ? process.argv[2] : 'en';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize (credentials, callback) {
     let clientSecret = credentials.installed.client_secret;
     let clientId = credentials.installed.client_id;
     let redirectUrl = credentials.installed.redirect_uris[0];
     let auth = new googleAuth();
     let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

     // Check if we have previously stored a token
     fs.readFile(TOKEN_PATH, (err, token) => {
         if(err) {
             getNewToken(oauth2Client, callback);
         } else {
             oauth2Client.credentials = JSON.parse(token);
             callback(oauth2Client);
         }
     });
 }


 /**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */

 function getNewToken(oauth2Client, callback) {
     let authUrl = oauth2Client.generateAuthUrl({
         access_type: 'offline',
         scope: SCOPES
     });
    console.log('Authorize this app by visiting this url:\n' + authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', code => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if(err) {
                console.log('Error while trying to retrieve access token', err );
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
 }


 /**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */

 function storeToken(token) {
     try {
         fs.mkdirSync(TOKEN_DIR);
     } catch (err) {
         if( err.code != 'EEXIST') {
             throw err;
         }
     }
     fs.writeFile(TOKEN_PATH, JSON.stringify(token));
     console.log('Token stored to ' + TOKEN_PATH);
 }

// Load client secrets from a local file
module.exports = function getToken(callback) {
  fs.readFile('./config/client_secret.json', (err, content) => {
    if(err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
    authorize(JSON.parse(content), callback);
  });
}

// module.exports = getToken;
