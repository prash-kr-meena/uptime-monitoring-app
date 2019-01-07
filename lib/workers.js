'use strict';

/**
* The workers are actually going to perform all the checks,  that are configured by all the users.
*  SO, one of the things the it need to do is gather-up all the checks.
*
*  as we are storing all of the checks in a serprate file ".Data/checks" --> so we would need to list all of the available checks.
*  in that directory.
*   So for that we would update our data librayry, which currently only does creating, deleting, updating, and reading file.
*  SO need to make a function to list the files. in a collection/directory
*/
//*  Worker related Tasks


// Dependiencies
const path = require('path');
const fs = require('fs');
const https = require('https');
var http = require('http');
const url = require('url');


const _data = require('./data');
const helpers  = require('./helpers');
const appConfig = require('./../config/appConfig');




// instantiate worker module object
const workers = {};



// Lookup all the checks, get their data and send to a validator
workers.gatherAllChecks = function () {
      // get all checks
      _data.list('checks',(err,checksArray) =>{
            if(!err && checksArray && checksArray.length > 0){
                  // loop through all the checks and read all the checks
                  checksArray.forEach( check => {
                        _data.read('checks', check, (err, originalCheckData) =>{
                              if(!err && originalCheckData)   {
                                    // pass it to the check validator, and let it confinue or log errors as needed
                                    workers.validateCheckData(originalCheckData);
                              }else{
                                    console.log('Error : while reading some of the check\'s data');
                              }
                        });
                  });

            }else{
                  console.log('Error : Not found any checks -OR- Error while reading the directory');
                  // NOTE :  this is a background process, there is no Requestor here so there is no one to callback response to, SO we are just going to log things out on the assumption that we will be going to look in the terminal in future if some error happens
            }
      });
};





// sanity check the check-data
workers.validateCheckData = function (check) {
      // validate the check data..
      check = typeof check === 'object' && check !== null ? check : {};
      check.id = typeof check.id === 'string' && check.id.trim().length === appConfig.randomStringLen ? check.id.trim() : false;
      check.phone = typeof check.phone === 'string' && check.phone.trim().length === 10 ? check.phone.trim() : false;
      check.protocol = typeof check.protocol === 'string' && ['http','https'].indexOf(check.protocol) >= 0 ? check.protocol : false;
      check.url = typeof check.url === 'string' && check.url.trim().length > 0 ? check.url.trim() : false;
      check.method = typeof check.method  === 'string' &&  ['POST','GET','PUT','DELETE'].indexOf(check.method) >= 0 ? check.method : false;
      check.successCodes = typeof check.successCodes === 'object' && check.successCodes instanceof Array && check.successCodes.length > 0 ? check.successCodes : false;
      check.timeoutSec = typeof check.timeoutSec === 'number' && check.timeoutSec % 1 === 0 && check.timeoutSec >= 1 && check.timeoutSec <= 5 ? check.timeoutSec : false;


      // Set the keys that may not be set (if the workers have never seen this check before)
      check.state = typeof check.state === 'string' && ['up','down'].indexOf(check.state) > -1 ? check.state : 'down';
      check.lastChecked = typeof check.lastChecked === 'number' && check.lastChecked > 0 ? check.lastChecked : false;
      // --> with this we can see an object and tell if the url is down because if has never been check before ie lastChecked is false
      // or if it is down state and it is the result of, a check, So the lastCheck would be a timeStamp..


      // If all checks pass, pass the data along to the next step in the process
      if(check.id && check.phone && check.protocol && check.url && check.method && check.successCodes && check.timeoutSec ){
            workers.performCheck(check);
      } else {
            // If checks fail, log the error and fail silently
            console.log("Error: one of the checks is not properly formatted. Skipping.");
      }
};





/// Perform the check, and send the CheckData and the outcome of the check process to the next step in the process
workers.performCheck = function (check) {
      // look the url, make the http OR https request to that url,
      // then its going to record that outcome and send, both of them to next step

      // preapare the check Outcome
      let checkOutcome = {
            'error' : false,
            'responseCode' : false,
      };

      // mark that the request has not been sent
      let outComeSent = false;

      // parse the hostname and the path out of the original check data.
      let parsedUrl = url.parse(check.protocol +'://'+check.url);
      let hostname = parsedUrl.hostname;
      let urlPath = parsedUrl.path; // we are not taking 'pathName', as it would not return the query-string

      // construct the request
      let requestObject = {
            'protocol' : check.protocol+':',
            'hostname' :hostname,
            'method': check.method, // this requires the method to be in upperCase(), and we already have it in UPPER CASE :)
            'path' : urlPath,
            'timeout': check.timeoutSec * 1000, // as it requreies the time in milliseconds, and we asked user to tell us in seconds
            // denotes the time it will wait for the response to come int.
      };

      // to make the request, instantiat the request object, using either the http or https module
      // depeinding on if you want to request http url OR and https url
      let _moduleToUse = check.protocol === 'http' ? http : https;
      let req = _moduleToUse.request(requestObject, (res)=>{
            // status of the response we got.
            // update the checkOutcome and pass the data along
            checkOutcome.responseCode = res.statusCode;
            if(!outComeSent){
                  workers.processCheckOutcome(check, checkOutcome);
                  outComeSent = true;
            }
      });


      // bind to the error event so it doesn't get thrown
      req.on('error', function(err){
            // update the checkOutcome and pass the data along
            checkOutcome.error = {
                  'error' : true,
                  'value' : err
            };
            if(!outComeSent){
                  workers.processCheckOutcome(check, checkOutcome);
                  outComeSent = true;
            }
      });

      // Bind to the time-out event
      req.on('timeout', function(err){
            // update the checkOutcome and pass the data along
            checkOutcome.error = {
                  'error' : true,
                  'value' : 'timeout error'+err,
            };
            if(!outComeSent){
                  workers.processCheckOutcome(check, checkOutcome);
                  outComeSent = true;
            }
      });

      // end/send the request
      req.end();
};




// Process the check outcome, update the check data as needed, trigger an alert (if needed)
//* Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = function(originalCheckData,checkOutcome){

      // Decide if the check is considered up or down
      let currentState = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) >= 0 ? 'up' : 'down';
      // --> there is NO error, and ther is a responseCode and that response code is on of hte given valid response Code mentioned by the user who created the checks
      console.log(currentState, checkOutcome.responseCode, "<<<<<+++++++++++");


      // Decide if an alert is warranted, it should be warned only if changed the state, from "up to down" OR from "down to up"
      var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== currentState ? true : false;
      // to check it really did had an state before, so if the check was down it really was down and wasn't defaul to down  cause it has never been checked before.
      // so for that we see if the lastChecked is true, so any value would be truthy instead of false, which is by default


      // Update the check data
      var newCheckData = originalCheckData;
      newCheckData.state = currentState;
      newCheckData.lastChecked = Date.now(); // TIME STAMP

      // Save the updates
      _data.update('checks',newCheckData.id,newCheckData,function(err){
            if(!err){
                  // Send the new check data to the next phase in the process if needed
                  if(alertWarranted){
                        workers.alertUserToStatusChange(newCheckData);
                  } else {
                        console.log("Check outcome has not changed, no alert needed");
                  }
            } else {
                  console.log("Error trying to save updates to one of the checks");
            }
      });
};


// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData){
      let msg = 'Alert: Your check for  "'+newCheckData.method.toUpperCase()+'"  '+newCheckData.protocol+'://'+newCheckData.url+' is currently "'+newCheckData.state +'"';

      helpers.sendTwilioSms(newCheckData.phone,msg,function(err){
            if(!err){
                  console.log("Success: User was alerted to a status change in their check, via sms: ",msg);
            } else {
                  console.log("Error: Could not send sms alert to user who had a state change in their check",err);
            }
      });
};




// Timer to execute the worker process Once per-Minute
workers.loopThrough = function () {
      setInterval(function () {
            workers.gatherAllChecks();
      }, 1000*3);
};



// init script
workers.init = function () {
      // execute all the checks immediately
      workers.gatherAllChecks();

      // call the loop so the checks, continue to execute later on ther own.
      workers.loopThrough();
};





// expor the worker module
module.exports = workers;
