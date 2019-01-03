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







// export the helpers library
module.exports = helpers;