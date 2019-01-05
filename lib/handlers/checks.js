'use strict';
/**
*           Checks service : Meat of our application

*     A Check is basically a task, that tells our system to 'go check this URL every x no os seconds'
*     -> and then tell the user (creater of these checks, whether  the url is up or down)
*
*     We will allow the user to create upto 5 checks.
*
*     will build the background process that need to perform the checking, FOR NOW
*     we need to just create a  check service with POST, GET, PUT & DELETE
*     -> that allows the users (who have loged-in and got the token)
*     to create upto 5 checks and have those checks listed in his account.
*/

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const _users = require('../../lib/handlers/users');
const appConfig = require('../../config/appConfig');


//! ------------------------ checks handler ----------------------------

// constainer for checks handler  // ! private member
let _checks = {};


// checks - GET
// required : id (checkId)   // as no payload so will be getting this from the query
// optional data : none

_checks.GET = function(data, callback){
      // as GET request so there is no payload, only the query So we need to pull phone from queryString obj
      let checkId = data.queryStringObject.checkId;
      checkId = typeof checkId === 'string' && checkId.trim().length === appConfig.randomStringLen ? checkId : false;
      if(checkId){
            // before reading the check, authenticate by checking the token, passed in the header
            let token = data.headers.token;
            token = typeof token === 'string' && token.trim().length === appConfig.randomStringLen ? token : false;
            if(token){
                  // read the check using checkId
                  _data.read('checks',checkId, (err, checkData)=>{
                        if(!err && checkData){
                              //  verify this token, does it match it with the given users phone present in the check
                              // basically checking the user who is trying to acces/see this check is the one who created this check
                              _users.verifyToken(token, checkData.phone, (err) =>{
                                    if(!err){
                                          callback(200, checkData); // read successfuly.
                                    }else{
                                          callback(403, {'Error' : 'Unauthorized.'});
                                    }
                              });
                        }else{
                              callback(400, {'Error' : 'No such check present -OR- Internal-Error while reading the check'});
                        }
                  });
            }else{
                  callback(405, {'Error' : 'Missing token OR invalid token.'});
            }
      }else{
            callback(405, {'Error' : 'Missing CheckId OR invalid field data'});
      }
};






// checks - POST

// required : protocol (http or https), url (that need to be checked), method (that we need to use for checking the url),
//             successCodes (array of codes that should be treated as success eg. 200 or 201 ie anything other then 400 to 500 range)
//             timeoutSec (if the url take more then this time to respond, we should consider it to be down)

// optional data : none
_checks.POST = function(data, callback){
      // collect data from the payload
      let protocol  = data.payload.protocol;
      let url  = data.payload.url;
      let method  = data.payload.method;
      let successCodes  = data.payload.successCodes;
      let timeoutSec  = data.payload.timeoutSec;

      protocol = typeof protocol === 'string' && ['http', 'https'].indexOf(protocol.toLocaleLowerCase()) >= 0 ? protocol.toLocaleLowerCase() : false;
      url = typeof url === 'string' && url.trim().length >= 0?  url  : false;
      method = typeof method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) >= 0 ? method.toUpperCase() : false;
      successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
      timeoutSec = typeof timeoutSec === 'number' && timeoutSec%1 ===0 && timeoutSec >= 1 && timeoutSec <= 5 ? timeoutSec : false;

      if(protocol && url && method && successCodes && timeoutSec){
            // check if the user has provided tokens in the headers
            // pull the token, and read up the user by using that token, we don't want to allow anonymous users to create checks.
            // for creting check/tasks the user has to be loged in first.

            let token = data.headers.token;
            token = typeof token === 'string' && token.length === appConfig.randomStringLen ? token : false;
            if(token){
                  // read the token
                  _data.read('tokens', token, (err, tokenData) =>{
                        if(!err){
                              // read the user data, using the phone present in the token
                              let userPhone = tokenData.phone;
                              _data.read('users',userPhone,(err, userData)=>{
                                    if(!err && userData){
                                          // check if ther is any check if not add them
                                          userData.checks = typeof userData.checks ==='object' && userData.checks instanceof Array ? userData.checks : [];

                                          // console.log(userData.checks, userData.checks.length, '<<-----');

                                          //  If there are check prsent
                                          // check how many of them, if full don't add more else add the given check
                                          if(userData.checks.length < appConfig.maxChecks){
                                                // for creating checks create random id for the checks
                                                let checkId = helpers.createRandomString(appConfig.randomStringLen);

                                                // create the checkObject, and include the user's phone So we can identify the user from the checks
                                                let checkObject = {
                                                      'phone' : userData.phone,
                                                      protocol,
                                                      url,
                                                      method,
                                                      successCodes,
                                                      timeoutSec
                                                };

                                                //  save the object in the checks collections
                                                _data.create('checks',checkId, checkObject,(err)=>{
                                                      if(!err){
                                                            // objec is saved on to disk, now also add this CheckId to the given user
                                                            userData.checks.push(checkId);

                                                            // udate the user's data
                                                            _data.update('users', userData.phone, userData,(err) =>{
                                                                  if(!err){
                                                                        callback(200, {'message' : 'Successfully created check and added the checkId to user Account',checkObject});
                                                                  }else{
                                                                        callback(500, {'Error' : 'Check Created BUT CheckId not added to the user account'});
                                                                  }
                                                            });
                                                      }else{
                                                            callback(500, {'Error' : 'Check could not be created, INTERNAL-ERROR'});
                                                      }
                                                });

                                          }else{
                                                callback(403, {'Error' : 'Max Check Limit, can\'t add more'});
                                          }
                                    }else{
                                          callback(403, {'Error' : 'WTF, token exists but USER don\'t  - OR - INTERNAL-ERROR while reading user  '});
                                    }
                              });
                        }else{
                              callback(403, {'Error' : 'No Such Token, UN-AUTHORIZED - OR - INTERNAL-ERROR while reading token'});
                        }
                  });
            }else{
                  callback(405, {'Error' : 'Token not provided OR Invalid Token'});
            }
      }else{
            callback(405, {'Error' : 'Missing required fields OR invalid field data'});
      }
};










// checks - PUT
// required : checkId
// optional data :  protocol, url, method, successcode, timeOutSec  --> but required atleast on optional data
_checks.PUT = function(data, callback){
      // get the checkId
      let checkId = data.payload.checkId;

      // collect oprtional data from the payload
      let protocol  = data.payload.protocol;
      let url  = data.payload.url;
      let method  = data.payload.method;
      let successCodes  = data.payload.successCodes;
      let timeoutSec  = data.payload.timeoutSec;

      protocol = typeof protocol === 'string' && ['http', 'https'].indexOf(protocol.toLocaleLowerCase()) >= 0 ? protocol.toLocaleLowerCase() : false;
      url = typeof url === 'string' && url.trim().length >= 0?  url  : false;
      method = typeof method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) >= 0 ? method.toUpperCase() : false;
      successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
      timeoutSec = typeof timeoutSec === 'number' && timeoutSec%1 ===0 && timeoutSec >= 1 && timeoutSec <= 5 ? timeoutSec : false;

      if(checkId){
            if(protocol || url || method || successCodes || timeoutSec){
                  // read the token, see if the request comes with the token
                  let token = data.headers.token;
                  token = typeof token === 'string' && token.trim().length === appConfig.randomStringLen ? token : false;
                  if(token){
                        // valid token --> need to check for Authentication
                        // read the check - if exists to get the user's phone  --> so we can authenticate the user
                        _data.read('checks', checkId, (err, checkData)=>{
                              if(!err && checkData){
                                    // check exists, now get user's phone and validate
                                    // ie. check if the user whose token we update the check, and the check has the same phone.
                                    _users.verifyToken(checkId, checkData.phone, (tokenIsValid)=>{
                                          if(tokenIsValid){
                                                // user verified, NOW you can start updating
                                                if(protocol){ checkData.protocol = protocol; }
                                                if(url) { checkData.url = url; }
                                                if(method){ checkData.method = method;}
                                                if(timeoutSec){checkData.timeoutSec = timeoutSec; }
                                                if(successCodes){checkData.successCodes = successCodes; }

                                                console.log('>>>>>>>>>>>>',checkData);

                                                // update the check object and persist into memory
                                                _data.update('checks', checkId, checkData, (err)=>{
                                                      if(!err){
                                                            callback(200, {'message' : 'successfully update the check'});
                                                      }else{
                                                            callback(500, {'Error' : 'Check could not be updated, Internal-Error'});
                                                      }
                                                });
                                          }else{
                                                callback(405, {'Error' : 'Unauthorized request'});
                                          }
                                    });
                              }else{
                                    callback(404, {'Error' : 'NO such check present OR Internal-Error while reading check'});
                              }
                        });
                  }else{
                        callback(405, {'Error' : 'Missing token OR Invalid data'});
                  }
            }else{
                  callback(405, {'Error' : 'Missing optional data, at least one optional data required'});
            }
      }else{
            callback(405, {'Error' : 'Missing required checkId OR invalid checkId'});
      }
};






// checks - DELETE
// required : checkId   // as no payload so will be getting this from the query
// optional data : none
_checks.DELETE = function(data, callback){
      // as DELETE request so there is no payload, only the query So we need to pull phone from queryString obj
      let checkId = data.queryStringObject.checkId;
      checkId = typeof checkId === 'string' && checkId.trim().length === appConfig.randomStringLen ? checkId : false;
      if(checkId){
            // before deleting the check, authenticate by checking the token, passed in the header
            let token = data.headers.token;
            token = typeof token === 'string' && token.trim().length === appConfig.randomStringLen ? token : false;
            if(token){
                  // read the check using checkId
                  _data.read('checks',checkId, (err, checkData)=>{
                        if(!err && checkData){
                              //  verify this token, does it match it with the given users phone present in the check
                              // basically checking the user who is trying to acces/see this check is the one who created this check
                              _users.verifyToken(token, checkData.phone, (err) =>{
                                    console.log(checkData);
                                    if(!err){
                                          // check exists and the user is authenticated : so now deleted it
                                          _data.delete('checks', checkId, (err)=>{
                                                if(!err){
                                                      //  check deleted now remove the corrosponding checkId from the user's check list
                                                      // ie update the user data
                                                      _data.read('users', checkData.phone, (err, userData)=>{
                                                            if(!err && userData){
                                                                  let checkPosition = userData.checks.indexOf(checkId);
                                                                  if(checkPosition >= 0){
                                                                        userData.checks.slice(checkPosition,1);

                                                                        // update the user objec by re-saving onto the disk
                                                                        _data.update('users',checkData.phone,userData, (err)=>{
                                                                              if(!err){
                                                                                    callback(200, {'message' : 'successfully removed check and checkId from user checklist'});
                                                                              }else{
                                                                                    callback(500, {'Error' : 'Could not upadaet User after removal of CheckId from user\'s check list',});
                                                                              }
                                                                        });
                                                                  }else{
                                                                        callback(500, {'Error' : 'CheckId of deleted Check, NOT present in user account',});
                                                                  }
                                                            }else{
                                                                  callback(500, {'Error' : 'InternalServer-Error Check deleted but CheckId could not be removed from user account',});
                                                            }
                                                      });
                                                }else{
                                                      callback(500, {'Error' : 'Could not delete check'});
                                                }
                                          });
                                    }else{
                                          callback(403, {'Error' : 'Unauthorized.'});
                                    }
                              });
                        }else{
                              callback(404, {'Error' : 'No such check present -OR- Internal-Error while reading the check'});
                        }
                  });
            }else{
                  callback(405, {'Error' : 'Missing token OR invalid token.'});
            }
      }else{
            callback(405, {'Error' : 'Missing CheckId OR invalid field data'});
      }
};







// export the tokens handler
module.exports = _checks;