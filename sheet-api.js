const fs = require('fs'),
    path = require('path'),
    readline = require('readline'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_DIR = path.join( (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE), 'credentials' );
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com.json';

// Path to target file (funnel configuration file)
const funnelPath = path.join(__dirname, '../dynamic-funnel/src/app/models/bariatric.ts');

// Construct funnel using chosen language
const chosenLanguage = process.argv[2] ? process.argv[2] : 'en';


// Load client secrets from a local file
fs.readFile('./config/client_secret.json', (err, content) => {
    if(err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
    authorize(JSON.parse(content), makeConfigFile);
});

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
    console.log('Authorize this app by visiting this url: ' + authUrl);
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
     console.log('Toekn stored to ' + TOKEN_PATH);
 }



 
 function translate(obj, lang, rows) {
     let stringify = JSON.stringify(obj);
     let targetStrings = stringify.match(/strId\_(\d)+/g);
     targetStrings.forEach( str => {
         let id = str.split('_')[1];
         stringify = stringify.replace(str, rows[id][lang]);
     });
     return stringify;
 }


 /**
 * Grabs data from the sheet and construc variable file.
 * Bariatric i18n sheet: https://docs.google.com/a/junomedical.com/spreadsheets/d/1LP0IHXaxNHo5Yns5e9C70UycAAENCJItoZUuhHuVE6g/edit?usp=sharing
 */

 function makeConfigFile(auth) {

     let sheets = google.sheets('v4');
   
     sheets.spreadsheets.values.get({
         auth: auth,
         spreadsheetId: '1LP0IHXaxNHo5Yns5e9C70UycAAENCJItoZUuhHuVE6g',
         range: 'Sheet1'
     }, (err, response) => {
         if(err) {
             console.log('The API returned an error: ' + err);
             return;
         }
        let rows = response.values;
        if(rows.length == 0) {
            console.log('No data found.');
        } else {
            // Find column of interest (the one for the selected language)
            let targetIndex = rows[0].findIndex(cell => cell === chosenLanguage );
            let pageTitle = rows[1][targetIndex];
            // File with structure of the object to be translated
            let skeleton = JSON.parse(fs.readFileSync('bariatric.de.json'));
            let translated = translate(skeleton, targetIndex, rows);
            fs.writeFileSync(funnelPath, 'export const bariatric: any = ', 'utf8');
            fs.appendFileSync(funnelPath, translated, 'utf8');
            console.log('Translated file saved to ' + funnelPath);
            /* for(let i = 0; i < rows.length; i++) {
                let row = rows[i];

            } */

        }
     })
 }
