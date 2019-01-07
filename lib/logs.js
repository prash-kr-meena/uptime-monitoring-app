'use strict';

/**
* library for storing and rotating logs
*/

// Dependencies
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');


// container for the module
let logs = {};

logs.baseDir = path.join(__dirname, '../.logs/');


logs.append = function (logfileName, logDataString, callback) {
      // open a file to be read
      fs.open(logs.baseDir + logfileName + '.log', 'a', (err, fileDiscriptor) =>{
            if(!err && fileDiscriptor){
                  fs.appendFile(fileDiscriptor, logDataString+'\n', (err)=>{
                        if(!err){
                              fs.close(fileDiscriptor, (err)=>{
                                    if(!err){
                                          callback(false);
                                    }else{
                                          callback('Error while closing the data to the file.');
                                    }
                              });
                        }else{
                              callback('Error while appending the data to the file.');
                        }
                  });
            }else{
                  callback('Error while opening the file for appending ');
            }
      });
};






// exports the module
module.exports = logs;