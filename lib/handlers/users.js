'use strict';

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');



//! ------------------------ users handler ----------------------------

// constainer for tokens handler  // ! private member
let _users = {};



_users.validatePayloadData = function (data, callback) {
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
_users.GET = function(data, callback){
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




// users - POST
// required : firstName, lastName, phone, password & tosAgreement
// optional data : none
_users.POST = function(data, callback){

      // validate user's data, check if its applicable for data operationg
      _users.validatePayloadData(data, function (err, usersData) {
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









// TODO :
// * only let the authenticated user UPDATE their own object, don't let them access anyone else's

// users - PUT
// required : phone
// ! optional data : firstName, lastName, password
_users.PUT = function(data, callback){

      // check if all the required fields are present and are valid
      let firstName = data.payload.firstName;
      let lastName = data.payload.lastName;
      let phone = data.payload.phone;
      let password = data.payload.password;


      firstName = typeof(firstName) === 'string' && firstName.trim().length > 2 ? firstName : false;
      lastName = typeof(lastName) === 'string'  && lastName.trim().length > 2  ? lastName : false;
      phone = typeof(phone) === 'string'&& phone.trim().length === 10 ? phone : false;
      password = typeof(password) === 'string'&& password.trim().length > 2 ? password : false;


      if(phone){
            if(firstName || lastName || password){
                  // check if user exists or not
                  _data.read('users', phone, function (err, usersData) {
                        if(err){
                              callback(400, {'Error' : 'User not found'});
                        }else{
                              if(firstName){
                                    usersData.firstName = firstName;
                              }

                              if(lastName){
                                    usersData.lastName = lastName;
                              }

                              if(password){
                                    usersData.hashedPassword = helpers.hash(password);// hash the password
                              }

                              //  we are identifying user uniquely with their no's
                              _data.update('users',phone, usersData, function (err) {
                                    if(err)   {
                                          callback(500,{'Error' : 'Could not update user data, SERVER Error.\n' + err});
                                    }else{
                                          callback(200, {'message' : 'successfull'});
                                    }
                              });
                        }
                  });
            }else{
                  callback(405, {'Error' : 'Missing optional fields'});
            }
      }else{
            callback(405, {'Error' : 'Missing required fields'});
      }
};







// TODO 1:
// * only let the authenticated user delete its object, don't let them access anyone else's
// TODO 2:
// * Cleanup (delete) any other data files associated with this user.

// users - DELETE
// required : phone
// optional data : none
_users.DELETE = function(data, callback){
      // check if valid phone no
      let phone = data.querystringObject.phone;
      if(typeof phone === 'string' && phone.trim().length === 10){
            _data.read('users',phone,function(err, data){
                  if(err){
                        callback(404,{'Error' : 'User not found'});
                  }else{
                        _data.delete('users',phone,function(err){
                              if(err){
                                    callback(500,{'Error' : 'User Could not be deleted, SERVER ERROR'});
                              }else{
                                    callback(200,{'message' : 'User deleted succssfully'});
                              }
                        });
                  }
            });
      }else{
            callback(405, {'Error' : 'Missing/Invalid phone no'});
      }
};





// export the tokens handler
module.exports = _users;