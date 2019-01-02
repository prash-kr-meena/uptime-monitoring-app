"use strict";

// Process
// The process object is a global that provides information about, and control over,
// the current Node.js process.As a global, it is always available to Node.js applications
// without using require().

console.log("\n\n process Object",process,"\n\n");

console.log("\n\n process.env Object",process.env, "\n\n");

// print process.argv
console.log("\n\nCommand Line arguments : ");
process.argv.forEach(function (val, index) {
      console.log(index + ': ' + val);
});


// Standard Method (no library)
// The arguments are stored in process.argv

// >>>> from node docs on handling command line args:
// process.argv is an array containing the command line arguments.
// The first element will be 'node', the second element will be the name of the JavaScript file.
// The next elements will be any additional command line arguments.



// ------------------------------------------------------------------------------------------------
      // so reather then starting the app with  'node app.js'  we want to start it with 'NODE_ENV=<Env-Name> node app.js'
      // this NODE_ENV command-line variable becomes available to us as global to use
      // --> instead of NODE_ENV we could say node-environment, or just environment ie we could take any name we want  but
      // BUT using NODE_ENV is just a conventions that many applications use.




// ------------------------------------------------------------------------------------------------

/**
* Create and export environment configuration variables
*/

// container for all the environments
const environments = {};


// staging (default) environment
environments.staging = {
      'port': 3000,
      'envName' : 'staging'
};

// production environment
environments.production = {
      'port': 5000,
      'envName' : 'production'
};

// Determine which environment was passed as the command-line argument


// NODE_ENV=production node app.js                               node app.js  --> then NODE_ENV is undefined
let currentEnvironment = process.env.NODE_ENV;
console.log(typeof currentEnvironment);
currentEnvironment = typeof (process.env.NODE_ENV === 'undefined') ?  '' : currentEnvironment.toLowerCase();
// console.log(currentEnvironment, "<<-------");


// if the sepcified environment does not exist then use the defualt 'staging' environment
let environmentToExport = typeof (environments[currentEnvironment] === 'undefined') ?  environments.staging : environments[currentEnvironment] ;


// Rather then exporting all the environments, will just export only the one that the application requires to run on.
module.exports = environmentToExport;


