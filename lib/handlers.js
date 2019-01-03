'use strict';


//! dependencies
const _data = require('./data');
const helpers = require('./helpers');


//? ------------------------------------ Server Request Handler ---------------------------------

// difining the request handlers
const handlers = {};


// not-found handler
handlers.notFoundHandler = function (data, callback) {
      console.log("notFoundHandler <<----- handled the request");
      callback(400);
};


handlers.pingHandler = function (data, callback) {
      console.log("pingHandler <<----- handled the request");
      callback(200);
};


handlers.users = function (data, callback) {
      console.log("HIT : users handler");

      // check the type of method the user has send
      let acceptableMethods = ['GET', 'POST', 'PUT', "DELETE"];
      if(acceptableMethods.indexOf(data.method) < 0){
            callback(405, {'Error' : 'Invalid method'});
      }else{
            // _user is a PRIVATE member of the handlers object
            handlers._user[data.method](data,callback);
      }
};

// ! private member
handlers._user = {};



handlers._user.validatePayloadData = function (data, callback) {
      console.log("inside it");
      let firstName = data.payload.firstName;
      let lastName = data.payload.lastName;
      let phone = data.payload.phone;
      let password = data.payload.password;
      let tosAgreement = data.payload.tosAgreement;
      // console.log(firstName, lastName, phone, phone.length, password, tosAgreement);

      // check if all the required fields are present and are valid

      firstName = typeof(firstName) === 'string' && firstName.trim().length > 2 ? firstName : false;
      lastName = typeof(lastName) === 'string'  && lastName.trim().length > 2  ? lastName : false;
      phone = typeof(phone) === 'string'&& phone.trim().length === 10 ? phone : false;
      password = typeof(password) === 'string'&& password.trim().length > 2 ? password : false;
      tosAgreement = typeof(tosAgreement) === 'boolean'&& tosAgreement === true ? true: false;

      // console.log(firstName, lastName, phone, password, tosAgreement);
      if(firstName && lastName && phone && password && tosAgreement){
            // user's data
            let data = {
                  firstName ,
                  lastName,
                  phone,
                  password,
                  tosAgreement
            };
            callback(false, data); // false denoting there wasn't any error.
      }else{
            callback(true); // some missing or invalid data
      }
};




// users - GET
// required : phone
// optional data : none
// Todo :
// * only let the authenticated user access their object, don't let them access anyone else's
handlers._user.GET = function(data, callback){
      // as GET request so there is no payload, only the query So we need to pull phone from queryString obj

      // check if the phone no is valid.
      let phone = data.querystringObject.phone;
      if(typeof phone === 'string' && phone.trim().length === 10){
            _data.read('users',phone,function (err, usersData) {
                  if(err){
                        callback(404,{'Error' : `User not found.\n`+err});
                  }else{
                        //  remove the hashpassword field from the user data, as they dont need to see it.
                        delete usersData.hashedPassword;
                        callback(200, usersData);
                  }
            });
      }else{
            callback(405,{'Error' : 'Missing/Invalid phone no'});
      }
};





// users - post
// required : firstName, lastName, phone, password & tosAgreement
// optional data : none
handlers._user.POST = function(data, callback){

      // validate user's data, check if its applicable for data operationg
      handlers._user.validatePayloadData(data, function (err, usersData) {
            if(err){
                  callback(405, {'Error' : 'Missing required fields OR invalid data.'});
            }else{
                  // check if the user doesn't already exists : check uniqueness of the user's phone no.

                  // we will try to read the file with the given phone no, if No-Error that means, user already exists
                  _data.read('users',usersData.phone, function(err){
                        if(!err){
                              callback(400, {'Error' : 'User already exists, with this phone no.'});
                        }else{
                              // hash the password
                              let hashedPassword = helpers.hash(usersData.password);

                              // add hashed password and delete the plain password
                              usersData.hashedPassword = hashedPassword;
                              delete usersData.password;

                              //  we are identifying user uniquely with their no's
                              _data.create('users',usersData.phone, usersData, function (err) {
                                    if(err)   {
                                          callback(500,{'Error' : 'Could not create the new user.\n' + err});
                                    }else{
                                          callback(200, {'message' : 'successfull'});
                                    }
                              });
                        }
                  });
            }
      });
};






// users - post
// required : firstName, lastName, phone, password & tosAgreement
// optional data : none
handlers._user.PUT = function(data, callback){

      // validate user's data, check if its applicable for data operationg
      handlers._user.validatePayloadData(data, function (err, usersData) {
            if(err){
                  callback(405, {'Error' : 'Missing required fields OR invalid data'});
            }else{
                  // hash the password
                  let hashedPassword = helpers.hash(usersData.password);

                  // add hashed password and delete the plain password
                  usersData.hashedPassword = hashedPassword;
                  delete usersData.password;

                  //  we are identifying user uniquely with their no's
                  _data.update('users',usersData.phone, usersData, function (err) {
                        if(err)   {
                              callback(500,{'Error' : 'Could not update user data.\n' + err});
                        }else{
                              callback(200, {'message' : 'successfull'});
                        }
                  });
            }
      });
};






// users - post
// required : phone
// optional data : none
handlers._user.DELETE = function(data, callback){
      // check if valid phone no
      let phone = data.querystringObject.phone;
      if(typeof phone === 'string' && phone.trim().length === 10){
            _data.delete('users',phone,function(err){
                  if(err){
                        callback(404,{'Error' : 'User not found'});
                  }else{
                        callback(200,{'message' : 'User deleted succssfully'});
                  }
            });
      }else{
            callback(405, {'Error' : 'Missing/Invalid phone no'});
      }
};






// -------------------------------------------------------------------------------------


module.exports = handlers;