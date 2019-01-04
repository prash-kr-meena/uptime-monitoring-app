'use strict';

/**
*    helper for various tasks
*/

// dependencies
const crypto = require('crypto');
const config = require('../config');


// helper container
const helpers = {};


// create a SHA256 hash
helpers.hash = function (str) {
      if(typeof(str) === 'string' && str.length > 0 ){
            let hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
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





// export the helpers library
module.exports = helpers;