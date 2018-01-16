'use strict';

const path = require('path');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const TOKEN_DIR = path.join( (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE), '.credentials' );

module.exports = {
  SCOPES: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  TOKEN_DIR: TOKEN_DIR,
  TOKEN_PATH: path.join(TOKEN_DIR, 'sheets.googleapis.com.json')
};
