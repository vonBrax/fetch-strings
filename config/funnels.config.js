'use strict';

const path = require('path');
const base_path = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const config = [
  {
    model_name: 'Vertical Stepper',
    app_name: 'dynamic-funnel',
    target_filename: 'bariatric.ts',
    funnel_sheetid: '1LP0IHXaxNHo5Yns5e9C70UycAAENCJItoZUuhHuVE6g'
  },
  {
    model_name: 'Click Funnel',
    app_name: 'ng-click-funnel',
    target_filename: 'strings.ts',
    funnel_sheetid: '1fijdE5xUKwHxNqmdJvfiKYrJv0WvAHW91V8XHP8Mcaw',
    landing_page_sheetid: '10WacLKHzC0L3mXqbtaFP3C2rafJvfX6P5zKpKGxXrJk'
  }
];

config.forEach(funnel => {
  funnel.target_file = path.join(
    base_path,
    `node/${funnel.app_name}/src/app/models/${funnel.target_filename}`)
});

module.exports = config;
