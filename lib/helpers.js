'use strict';

/**
*    helper for various tasks
*/

// dependencies
const crypto = require('crypto');
const appConfig = require('../config/appConfig');


const twilioConfig = require('../config/twilioConfig');
const querystring = require('querystring');
const https = require('https'); // for creating https server as well as, for requesting an https link/endpoint, ie sending an https request


// helper container
const helpers = {};


// create a SHA256 hash
helpers.hash = function (str) {
      if(typeof(str) === 'string' && str.length > 0 ){
            let hash = crypto.createHmac('sha256',appConfig.hashingSecret).update(str).digest('hex');
            return hash;
      }else{
            return false;
      }
};


// parse the json string to an object
helpers.parseJsonToObject = function(str){
      let jsonObject = {};
      try {
            jsonObject = JSON.parse(str);
      } catch (exception) {
            console.log('Could not parse the json data.\n' + exception );
      }

      console.log('parsed object ==> \n' , jsonObject);
      return jsonObject;
};


// create a random string of given length;
helpers.createRandomString = function(len){
      len =  typeof len === 'number' && len > 0 ? len : false;
      if(len){
            let validCharacters = 'qwertyuioplkjhgfdsazxcvbnm0123456789';
            let randomStr = '';
            for(let i=0; i<len; i++){
                  let randomChar = validCharacters.charAt(Math.floor(Math.random() * validCharacters.length));
                  randomStr += randomChar;
            }
            console.log(randomStr , "<<<<<<< RANDOM");
            return randomStr;
      }else{
            console.log(false , "<<<<<<< RANDOM");
            return false;
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
helpers.sendTwilioSms = function(phoneNo, msg, callback){
      // validate the parameters
      phoneNo = typeof phoneNo === 'string' && phoneNo.trim().length === 10 ? phoneNo.trim() : false;
      msg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <=1500 ? msg.trim() : false;

      if(phoneNo && msg){
            // configure the request payload
            // we are going to send a payload to twilio, as a post to the specified END-POINT and that will automatically send msg to user
            let payload = {
                  'From' : twilioConfig.fromPhone,
                  'To':'+91'+ phoneNo,
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






// export the helpers library
module.exports = helpers;