"use strict";
/**
* Create and export environment configuration variables
*/


// Rather then having one port we need to listen now on two ports, as http and https conflict with each other
// So, one port will be for http and another for https



// container for all the environments
const environments = {};


// staging (default) environment
environments.staging = {      // in GENERAL most apps have    http on port 80       and https on port 443
      'httpPort': 3000, //       which is the convention followed from long ago.
      'httpsPort': 3001,//          and thats what most browser expect, on production you should chose them.
      'envName' : 'staging'
};

// production environment
environments.production = {
      'httpPort': 5000,
      'httpsPort': 5001,
      'envName' : 'production'
};

// Determine which environment was passed as the command-line argument

// NODE_ENV=production node app.js                               node app.js  --> then NODE_ENV is undefined
let currentEnvironment = process.env.NODE_ENV;
currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ?  currentEnvironment.toLowerCase() : '' ;


// if the sepcified environment does not exist then use the defualt 'staging' environment
let environmentToExport = typeof (environments[currentEnvironment]) === 'object' ?  environments[currentEnvironment]  : environments.staging;


// Rather then exporting all the environments, will just export only the one that the application requires to run on.
module.exports = environmentToExport;


