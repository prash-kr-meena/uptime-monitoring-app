'use strict';


//! dependencies
const _users = require('./handlers/users');     //? private handlers
const _tokens = require('./handlers/tokens');
const _checks = require('./handlers/checks');





//? ------------------------------------ Server Request Handler ---------------------------------

// difining the request handlers
const handlers = {};


// not-found handler
handlers.notFoundHandler = function (data, callback) {
      console.log("notFoundHandler <<----- handled the request");
      callback(400);
};


// ping handler
handlers.pingHandler = function (data, callback) {
      console.log("pingHandler <<----- handled the request");
      callback(200);
};


//! ------------------------ users handler ----------------------------

handlers.users = function (data, callback) {
      console.log("HIT : users handler");

      // check the type of method the user has send
      let acceptableMethods = ['GET', 'POST', 'PUT', "DELETE"];
      if(acceptableMethods.indexOf(data.method) < 0){
            callback(405, {'Error' : 'Invalid method'});
      }else{
            // _user is a PRIVATE member of the handlers object
            _users[data.method](data,callback);
      }
};



//! ------------------------ tokens handler ----------------------------

handlers.tokens = function (data, callback) {
      console.log("HIT : tokens handler");

      // check the type of method the user has send
      let acceptableMethods = ['GET', 'POST', 'PUT', "DELETE"];
      if(acceptableMethods.indexOf(data.method) < 0){
            callback(405, {'Error' : 'Invalid method'});
      }else{
            // _token is a PRIVATE member of the handlers object
            _tokens[data.method](data,callback);
      }
};



//! ------------------------ checks handler ----------------------------

handlers.checks = function (data, callback) {
      console.log("HIT : checks handler");

      // check the type of method the user has send
      let acceptableMethods = ['GET', 'POST', 'PUT', "DELETE"];
      if(acceptableMethods.indexOf(data.method) < 0){
            callback(405, {'Error' : 'Invalid method'});
      }else{
            // _check is a PRIVATE member of the handlers object
            _checks[data.method](data,callback);
      }
};


// -------------------------------------------------------------------------------------

module.exports = handlers;