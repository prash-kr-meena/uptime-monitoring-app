'use strict';


//! dependencies
const querystring = require('querystring');
const https = require('https'); // for creating https server as well as, for requesting an https link/endpoint, ie sending an https request

const _users = require('./handlers/users');     //? private handlers
const _tokens = require('./handlers/tokens');
const _checks = require('./handlers/checks');

const twilioConfig = require('../config/twilioConfig');




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


//! ------------------------ twilio sms handler ----------------------------
/**
*     One of the most common task while building the application is to integrate with another api (3rd paryt API)
*     FOR that many developers would go to that 3rd library website and look for a nodejs library they provide  OR
*     look for a npm package that someOne else written to interacting with that API.
*
*     But there is Another Way to Intgrate ,
*     --> YOU can simply craft a simple HTTP or HTTPS message and send them off to 3rd party API'S that they have exposed
*/


// function to integrate with twilio service, and allows us to send SMS via twilio
handlers.sendTwilioSms = function(phoneNo, msg, callback){
      // validate the parameters
      phoneNo = typeof phoneNo === 'string' && phoneNo.trim().length === 10 ? phoneNo.trim() : false;
      msg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <=1500 ? msg.trim() : false;

      if(phoneNo && msg){
            // configure the request payload
            // we are going to send a payload to twilio, as a post to the specified END-POINT and that will automatically send msg to user
            let payload = {
                  'From' : twilioConfig.fromPhone,
                  'To':'+1'+ phoneNo,
                  'Body':msg
            };

            // stringify the payload, that need to be send
            let stringPayload = querystring.stringify(payload); // instead of JSON.stringfy we use querystring.stringfy
            console.log(stringPayload);

            // configure the request details
            let reequestDetails = {
                  'protocol' : 'https:',
                  'hostname' : 'api.twilio.com',
                  'method' : 'POST',
                  'path' : '/2010-04-01/Accounts/'+twilioConfig.accountSid+'/Messages.json',
                  'auth' :twilioConfig.accountSid+':'+twilioConfig.authToken, // authentication header for basic authentication header
                  'headers' : {
                        'Content-Type' : 'application/x-www-form-urlencoded', // this is not a json api, it more traditional so this format
                        // and that is why we queryStringfy it rather then json stringfy it.
                        'Content-Length' : Buffer.byteLength(stringPayload),
                  }
            };


            // create a request and send it off
            // instantiate the request object
            let request = https.request(reequestDetails, function(response){
                  // grab the status code of the incoming response
                  let statusCode = response.statusCode;

                  // callback successfull if the request went through
                  if(statusCode === 200 || statusCode === 201){
                        callback(false);// successful
                  }else{
                        callback('status code returned was : '+ statusCode);
                  }
            });
            // this the request, now we need to send it off and also handle ERRORS in case any error any error happens,

            // Bind to the error, so it doesn't get thrown
            request.on('error', function(err){           // when this request object emifts an error
                  callback(err);
            });

            // add the payload to the string
            request.write(stringPayload);

            // end the request --> sending off         as soon as the application hits this point, its going to send the request off
            request.end();          //                   so the callback will happen because either theresponse came back or an error happened
      }else{
            callback('Missing/Invalid parameters');
      }
};

// -------------------------------------------------------------------------------------

module.exports = handlers;