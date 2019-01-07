'use strict';

/**
* Now we have much of the API in place, we have a way to create user, to sign in , to create checks, SMS alerts... and all other operations
* So, now need to perform the  checks that the usre created. --> and for that we need background workers. ie background processes
*
* SO now the nature of our application is fundamentaly changing. We are going from a server that simply startsup and listen on some port
* to an application that starts up the server and the  background workers and need to be able to do both tasks at the same time.
*
* The current structure where our app.js, starts up the server and contains all the server logic. __> this will not work anymode.
* So we need to refactor, and  so the app.js will simply call a server file (containing all the server logic) to starts up the server.
* And it will also call the worker file which will simply start up all the background workers.
*
*/

/**
* primary file for the API
*/

//! Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');


// Declare the app
const app  = {};


// init function
app.init = function () {
      // starts the server
      server.init();

      // start the worker
      workers.init();
};


//  execute the init function
app.init();

// Export the app, can be used for testing
module.exports = app;


