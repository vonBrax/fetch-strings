'use strict';

const getToken = require('./controllers/google.auth.controller'),
  cli = require('./controllers/funnels.controller'),
  drawing = require('./models/drawings');

console.log('###### Funnel and Landing Page Strings #########');
console.log(drawing.logo);
console.log('Checking credentials...');

const token = getToken(token => {
  console.log('Authentication complete!');
  console.log(drawing.lets);
  console.log(drawing.some);
  console.log(drawing.funnel);
  initCli(token);
  return token;
});

function initCli(token) {
  cli(token);
}
