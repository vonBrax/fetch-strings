'use strict';

const readline = require('readline'),
  fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec,
  google = require('googleapis');

const config = require('../config/funnels.config');

function cli(token) {
  if (!token) {
    console.log('TOKEN NOT FOUND. ABORTING...');
    return;
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  console.log('');
  console.log('\x1b[41m \x1b[37m \x1b[5m WELCOME TO THIS AMAZING PIECE OF SOFTWARE!! =) \x1b[0m');
  console.log('Select model to use: ');
  for (let i = 0; i < config.length; i++) {
    console.log(`${i} - ${config[i].model_name}`);
    if(i == config.length - 1) {
      console.log(`${i + 1} - Exit`);
    }
  }
  rl.question('Answer: ', answer => {
      // rl.close();
      const toNum = parseInt(answer);
      const model = config[toNum];
      if(!model) { process.exit(); }
      console.log('Selected model: ' + model.model_name );
      console.log('Funnel Sheet ID: ' + model.funnel_sheetid );
      if (model.landing_page_sheetid) { console.log('Landing Page Sheet ID: ' + model.landing_page_sheetid); }

      console.log('Please select language to use: ');
      console.log('0 - EN');
      console.log('1 - DE');
      rl.question('Answer:', answer => {
        model.language = parseInt(answer) === 1 ? 'DE' : 'EN';
        console.log('Selected language: ' + model.language);
        rl.close();

        if (model.landing_page_sheetid) {

          // grabSheet(token, model, true)
          //   .then( data => {
          //     const index = findColumnIndexes(data[0], model.language);
          //     // Landing page strings
          //     return replacePageStrings(model, data, index);
          //   })
          //   .then( lpData => {
          //     const funnelData = grabSheet(token, model)
          //   })
          //   .catch(err => console.log(err));

            Promise.all([
              grabSheet(token, model, true), // Landing page strings
              grabSheet(token, model) // Funnel strings
            ])
            .then(data => {
              const lpIndex = findColumnIndexes(data[0][0], model.language);
              const funnelIndex = findColumnIndexes(data[1][0], model.language);

              const lpStrings = replacePageStrings(model, data[0], lpIndex);
              const funnelStrings = buildFunnelStrings(model, data[1], funnelIndex);
              saveStringsFile(model, lpStrings, funnelStrings);
            })
            .catch(err => console.log(err));
        }

        // grabSheet(token, model)
        //   .then( data => {
        //     const index = findColumnIndexes(data[0], model.language);
        //     const funnel = buildFunnelStrings(model, data, index);
        //   })
        //   .catch(err => console.log(err));


      });
  });
}

function grabSheet(auth, model, isLandingPage) {
  const id = isLandingPage ? model.landing_page_sheetid : model.funnel_sheetid;
  const sheets = google.sheets('v4');

  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: id,
      range: 'Sheet1'
    }, (err, response) => {
      if(err) {
          console.log('The API returned an error: ' + err);
         return reject(err);
          // return;
      }
     let rows = response.values;
     if(rows.length == 0) {
         console.log('No data found. Aborting process');
        return reject('No data found');
         // return null;
     } else {
      // const index = findColumnIndexes(rows[0], model.language);
      // const landingPage = replacePageStrings(model, rows, index);
        return resolve(rows);
       //return rows;
     }
    });

  });

  /*
  if(model.funnel_sheetid) {
    sheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: model.funnel_sheetid,
      range: 'Sheet1'
    }, (err, response) => {
      if(err) {
          console.log('The API returned an error: ' + err);
          return;
      }
     let rows = response.values;
     if(rows.length == 0) {
         console.log('No data found. Aborting process');
         return null;
     } else {
      //const sectionCol = rows[0].findIndex(cell => cell === 'SECTION');
      //const langCol = rows[0].findIndex(cell => cell === model.language );
      const index = findColumnIndexes(rows[0], model.language);
      const funnel = buildFunnelStrings(model, rows, index);
     }
    });
  }
  */
}

function findColumnIndexes(row, lang) {
  const sectionCol = row.findIndex(cell => cell === 'SECTION');
  const langCol = row.findIndex(cell => cell === lang );
  return {section: sectionCol, language: langCol };
}

function buildFunnelStrings(model, rows, index) {
  let funnel_name, funnel = [];
  let step = {
    name: '',
    type: 'radio-click',
    validators: ['required'],
    question: '',
    answers: []
  };
  let personalField = {
    name: '',
    type: '',
    placeholder: '',
    error_message: '',
    validators: []
  };

  let currStep, newStep, currName, newName;
  for (let i = 1; i < rows.length; i++) {

    let section = /step/.test(rows[i][index.section]) ? 'step' : rows[i][index.section];

    //console.log(rows[i][index.section] + ' is step? ' + /step/.test(rows[i][index.section]));

    switch(section) {
      case 'funnel_name':
        funnel_name = rows[i][index.language];
        continue;
      case 'step':
        currStep = rows[i][index.section]; newStep = newStep || currStep;
        break;
      case 'name':
        if (currStep === 'personal_information') {
          // personalField.name = rows[i][index.language];
          currName = rows[i][index.language];
          newName = newName || currName;
         } else {
           step.name = rows[i][index.language];
         }
        break;
      case 'question':
        step.question = rows[i][index.language];
        continue;
      case 'answers':
      case '':
        step.answers.push(rows[i][index.language]);
        continue;
      case 'subtitle':
        step.subtitle = rows[i][index.language];
        continue;
      case 'placeholder':
        personalField.placeholder = rows[i][index.language];
        continue;
      case 'error_message':
        personalField.error_message = rows[i][index.language];
        continue;
      case 'required':
        rows[i][index.language].toLowerCase() === 'true' ? personalField.validators.push('required') : '';
        continue;
      case 'tos':
         step.tos = rows[i][index.language];
         currName = 'End of fields!';
         break;

      case 'personal_information':
        // Save the last step before personal information
        funnel.push(Object.assign({}, step));
        currStep = 'personal_information';
        newStep = 'personal_information';
        step.name = 'personal_information';
        step.type = 'personal_information';
        step.subtitle = '';
        step.fields = [];
        delete step.answers;
    }

    if ( currName && currName !== newName) {
      personalField.name = newName;
      personalField.type = 'text';
      if (personalField.name === 'phone_number') {
        personalField.type = 'phone';
      } else if (personalField.name === 'email') {
        personalField.type = 'email';
      }
      step.fields.push(Object.assign({}, personalField));
      personalField.validators = [];
      newName = currName;

    } else if (currName) {
      personalField.name = rows[i][index.language];
    }

    if( newStep !== currStep || i === rows.length - 1) {
      funnel.push(Object.assign({}, step));
      step.answers = [];
      newStep = currStep;
    }
  }
  return {funnel_name, funnel}
}



function replacePageStrings(model, rows, index) {
  // Use current strings.ts file to get all needed strings
  // and use it as guide during strings replacement
  const modelFilePath = buildModelFile(model.target_file);
  const modelFile = loadModelFile(modelFilePath, model);
  // Get the index for the SECTION column
  const sectionCol = index.section; // rows[0].findIndex(cell => cell === 'SECTION');
  // Get the index of the desired language column
  const langCol = index.language; // rows[0].findIndex(cell => cell === model.language );

  // Find the correspondent interval for each property in
  // guide file (properties name in the file should match
  // the names in the SECTION column)
  const intervals = findRowsInterval(sectionCol, rows);
  const result = JSON.parse(JSON.stringify(modelFile));

  for (var k in modelFile) {
    const strings = grabSectionStrings(rows, langCol, intervals[k]);
    if (!strings) {
      console.log('No strings found for section with key: ' + k);
      continue;
    }
    // Deep copy object to try to maintain some immutability here..
    let section = JSON.parse(JSON.stringify(result[k]));
    traverseAndReplace(section, strings);
    result[k] = section;
  }
  // saveStringsFile(model, result);
  return result;
}

function buildModelFile(tsFilePath) {
  const fileName = path.basename(tsFilePath).replace('.ts', '');
  const content = fs.readFileSync(tsFilePath, 'utf8');
  const jsContent = content.replace('export const ', 'exports.');
  fs.writeFileSync(`./models/${fileName}.js`, jsContent);
  return path.join(__dirname, `../models/${fileName}.js`);
}

function loadModelFile(jsFilePath, model) {
  const file = require(jsFilePath);
  let key;
  for (var k in file) {
    key = k;
    break;
  }
  // Store the variable name defined in the ts file
  model.var_name = key;

  // if ('funnel' in file[key]) { delete file[key].funnel; }
  // if ('funnel_name' in file[key]) { delete file[key].funnel_name; }
  return file[key];
}

function findRowsInterval(col, rows) {
  let intervals = {};
  let section = {};

  for (let i = 1; i < rows.length; i++) {

    if(rows[i][col] && !section.key) {
      section.key = rows[i][col];
      section.start = i;
    } else if (rows[i][col]) {
      section.end = i - 1;
      intervals[section.key] = {
        start: section.start,
        end: section.end
      };
      section.start = i;
      section.key = rows[i][col];
    } else if (i === rows.length - 1) {
      section.end = i;
      intervals[section.key] = {
        start: section.start,
        end: section.end
      };
    }
  }
  return intervals;
}

function grabSectionStrings(rows, col, interval) {
  if (!interval) {
    return;
  }
  let strings = [];
  for (var i = interval.start; i <= interval.end; i++) {
    strings.push(rows[i][col]);
  }
  return strings;
}

function traverseAndReplace(section, strings, counter = 0) {
  if (counter >= strings.length) {
    throw new Error('Error: Different number of model strings and i18n strings.');
    return;
  }
  for(var k in section) {
   // console.log(k + ': ' + typeof source[k]);
    if(typeof section[k] === 'string') {
      section[k] = strings[counter];
      counter++;
    } else if (typeof section[k] === 'number') {
      section[k] = parseInt(strings[counter]);
      counter++;
    } else {
      counter = traverseAndReplace(section[k], strings, counter);
    }
  }
  return counter;
}

function saveStringsFile(model, lpStrings, funnelStrings ) {
  if(funnelStrings) {
    console.log('#############################################################################');
    lpStrings.funnel = funnelStrings.funnel;
    lpStrings.funnel_name = funnelStrings.funnel_name;
  }

  fs.writeFileSync(model.target_file, `export const ${model.var_name} = ${JSON.stringify(lpStrings, null, 2)};`);
  console.log(`Strings file saved to ${model.target_file}`);
  loadAdditionalOptions(model);
}

function loadAdditionalOptions(model) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const base_path = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  const appPath = path.join(base_path, 'node/' + model.app_name + '/');
  let command;
  console.log('Please select an option:');
  console.log('0 - Build dist files');
  console.log('1 - Exit');

  rl.question('Answer: ', answer => {
    rl.close();
    const num = parseInt(answer);
    switch(num) {
      case 0: command = '/usr/local/lib/node_modules/@angular/cli/bin/ng'; break;
      case 1: console.log('Thanks for using this amazing tool. Bye!'); process.exit();
    }

    // command + ' build -e ' + appPath + '--prod --aot --build-optimizer'
    console.log('Build function not yet implemented... =(');
    console.log('Please run this in the app folder: ng build --prod --aot --build-optimizer');
    /* exec(appPath + 'npm run build', (err, stdout, stderr) => {
      if (err) {
        console.log('Node could not execute command');
        console.log(appPath + 'npm run build');
        console.log(command + ' build -e ' + appPath + '--prod --aot --build-optimizer');
        return;
      }
      console.log(`Stdout: ${stdout}`);
      console.log(`Stderr: ${stderr}`);
      console.log('Exiting program now');
      process.exit(0);
    }); */
  });
}

module.exports = cli;
