'use strict';


// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const appConfig = require('../../config/appConfig');



//! ------------------------ tokens handler ----------------------------

// constainer for tokens handler  // ! private member
let _tokens = {};




// tokens - POST
// required : phone , password
// optional : none
_tokens.POST = function (data, callback) {
      let phone = data.payload.phone;
      let password = data.payload.password;

      // check if all the required fields are present and are valid
      phone = typeof(phone) === 'string'&& phone.trim().length === 10 ? phone.trim() : false;
      password = typeof(password) === 'string'&& password.trim().length > 2 ? password.trim() : false;

      if(phone && password){
            // check if the specified user exists
            _data.read('users', phone, function(err, userData){
                  if(!err && userData){
                        // check if the password is correct
                        let hashedPass = helpers.hash(password);
                        if(hashedPass === userData.hashedPassword){
                              // AUTHENTICATED -> Create a token with random_name and an expiray time of 1 hr
                              let tokenId = helpers.createRandomString(appConfig.randomStringLen);
                              let expires = Date.now() + 1000 * 60 * 60 ; // adding 1 hr in millisec

                              let tokenObject = {
                                    'phone' : phone,  // we can identify whose token is this
                                    'id' : tokenId,   // as well as we can identify the token uniquely
                                    'expires' : expires
                              };

                              // persist the token on disk
                              _data.create('tokens', tokenId, tokenObject,(err)=>{
                                    if(!err){
                                          callback(200, tokenObject); //? successfull
                                    }else{
                                          callback(500, {'Error' : 'INTERNAL-ERROR -> Could not create token'+ err});
                                    }
                              });
                        }else{
                              callback(405, {'Error' : 'Wrong password'});
                        }
                  }else{
                        callback(400, {'Error' : 'NO such user exists'});
                  }
            });
      }else{
            callback(405, {'Error' : 'Missing required fields or Invalid fileds'});
      }
};





// tokens - GET
// required : id (tokenId) // will be sent as query
// optional : none
_tokens.GET = function (data, callback) {
      // check if id is valid
      let id = data.queryStringObject.id;
      id = typeof id === 'string' && id.trim().length === appConfig.randomStringLen ? id.trim() : false;

      if(id){ // lookup token
            _data.read('tokens',id,function (err, tokenData) {
                  if(!err && tokenData){
                        callback(200,tokenData);
                  }else{
                        callback(404,{'Error' : `NO such token present- Authenticate yourself first.\n`});
                  }
            });
      }else{
            callback(405,{'Error' : 'Missing/Invalid token-id'});
      }
};






// tokens - PUT
// required : id (token-id), extend (to extend the expiry time by 1 hr);
// optional : none
_tokens.PUT = function (data, callback) {
      let id = data.payload.id;
      let extend = data.payload.extend;

      // check if all the required fields are present and are valid
      id = typeof(id) === 'string'&& id.trim().length === appConfig.randomStringLen ? id.trim() : false;
      extend = typeof(extend) === 'boolean'&& extend === true ? true : false;

      if(id && extend){
            // lookup the token
            _data.read('tokens', id, (err, tokenData) =>{
                  if(!err && tokenData){
                        // check if the token is expired or not
                        if(tokenData.expires > Date.now()){
                              // update the token exipiray time by 1 hr
                              tokenData.expires = Date.now() + 1000 * 60 * 60;
                              _data.update('tokens', id, tokenData,(err) =>{
                                    if(!err){
                                          callback(200, {'message':'successfully extended the token expiry'});
                                    }else{
                                          callback(500,{'Error' : `Could not update, INTERAL-SERVER-ERROR.`});
                                    }
                              });
                        }else{
                              callback(405,{'Error' : `Token already Expired. Can't be extended`});
                        }
                  }else{
                        callback(404,{'Error' : `NO such token present.`});
                  }
            });
      }else{
            callback(405,{'Error' : 'Missing/Invalid token-id'});
      }
};






// tokens - DELETE
// required : id (tokenId) // will be sent as query
// optional : none
_tokens.DELETE = function (data, callback) {
      // check if id is valid
      let id = data.queryStringObject.id.trim();
      id = typeof id === 'string' && id.length === appConfig.randomStringLen ? id : false;

      if(id){ // lookup token
            _data.read('tokens',id,function (err, tokenData) {
                  if(!err && tokenData){
                        // unlink token
                        _data.delete('tokens', id, (err) =>{
                              if(!err){
                                    callback(200,tokenData);
                              }else{
                                    callback(500,{'Error' : `while unlinking the token\n`});
                              }
                        });
                  }else{
                        callback(404,{'Error' : `NO such token present- Authenticate yourself first.\n`});
                  }
            });
      }else{
            callback(405,{'Error' : 'Missing/Invalid token-id'});
      }
};






// export the tokens handler
module.exports = _tokens;