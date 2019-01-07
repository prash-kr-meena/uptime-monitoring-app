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


// appednd the logs to the file
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



/**
* these files are going to become huge, very fast, so we need to compresss them,
* so we need to compresss them once a day, use the zlib library to compress them, and for the next coming day put the data into different file instead of makeing a larger and larger file.
* Easy to compress as most of the data is redudent
*
* After we compress the logs, we want to save them with a time stamp, in there name so that if we want to look-up a log.  and figureout the name and decompress the contents of the file and read it
*/



// List all the logs, and optionally include the compressed logs
logs.list = function(includeCompressedLogs,callback){
      fs.readdir(logs.baseDir, function(err,data){
            if(!err && data && data.length > 0){
                  var trimmedFileNames = [];
                  data.forEach(function(fileName){

                        // Add the .log files
                        if(fileName.indexOf('.log') > -1){
                              trimmedFileNames.push(fileName.replace('.log',''));
                        }

                        // Add the .gz files, as we are doing zlib compression, which ends things with .gz
                        //  and also putting the .b64 extension, as we are base64 encoding them so we can read then easily later on
                        if(includeCompressedLogs && fileName.indexOf('.gz.b64') > -1){
                              trimmedFileNames.push(fileName.replace('.gz.b64',''));
                        }

                  });
                  callback(false,trimmedFileNames); // all of the above work is synchronous
            } else {
                  callback(err,data); // 'NO logs to be read and compressed'
            }
      });
};


// Compress the contents of one ".log" file into a ".gz.b64" file within the same directory
logs.compress = function(logId,newFileName,callback){
      let sourceFile = logId +'.log';
      let destFile = newFileName +'.gz.b64';

      // Read the source file
      fs.readFile(logs.baseDir+sourceFile, 'utf8', function(err,inputString){
            if(!err && inputString){
                  // Compress the data using gzip
                  zlib.gzip(inputString,function(err,buffer){ // biffer containing the compressed data
                        if(!err && buffer){
                              // Send the data to the destination file, ie write into the file
                              fs.open(logs.baseDir+destFile, 'wx', function(err, fileDescriptor){
                                    if(!err && fileDescriptor){
                                          // Write to the destination file, for that first conver this buffer into a sting of base64
                                          fs.writeFile(fileDescriptor, buffer.toString('base64'),function(err){
                                                if(!err){
                                                      // Close the destination file
                                                      fs.close(fileDescriptor,function(err){
                                                            if(!err){
                                                                  callback(false);
                                                            } else {
                                                                  callback(err);
                                                            }
                                                      });
                                                } else {
                                                      callback(err);
                                                }
                                          });
                                    } else {
                                          callback(err);
                                    }
                              });
                        } else {
                              callback(err);
                        }
                  });
            } else {
                  callback(err);
            }
      });
};





// Decompress the contents of a .gz file into a string variable
logs.decompress = function(fileId,callback){
      var fileName = fileId+'.gz.b64';
      fs.readFile(logs.baseDir+fileName, 'utf8', function(err,str){
            if(!err && str){
                  // Inflate the data,
                  var inputBuffer = Buffer.from(str, 'base64'); // <<--- convert it to buffer from a base64 encoded string

                  // decompress Decompress the data from the buffer
                  zlib.unzip(inputBuffer,function(err,outputBuffer){ // decompressed buffer
                        if(!err && outputBuffer){
                              // Callback
                              var str = outputBuffer.toString();
                              callback(false,str);
                        } else {
                              callback(err);
                        }
                  });
            } else {
                  callback(err);
            }
      });
};



// Truncate a log file
logs.truncate = function(logId,callback){
      fs.truncate(logs.baseDir+logId+'.log', 0, function(err){
            if(!err){
                  callback(false);
            } else {
                  callback(err);
            }
      });
};





// exports the module
module.exports = logs;