'use strict';

/**
* library for storing and editing data
*/

// dependencies

const fs = require('fs');
const path = require('path'); // for normalizing the patsh to different directories.


// container for this module
const lib = {};

// base directory for the data folder
lib.basePath = path.join(__dirname + '/../.data/');

// write data to the file
lib.create = function (directory, file, data, callback) {
      let filePath  = lib.basePath + directory+'/' + file + '.json';

      console.log(filePath);
      // open the file to write
      fs.open(filePath, 'w', function(err, fileDiscriptor){      // fileDiscriptor uniquely identifies a file

            if(!err && fileDiscriptor){ // there is no error and fileDiscriptor is there
                  let dataString = JSON.stringify(data);  // convert data to string

                  // write to file and close it.
                  fs.writeFile(filePath, dataString, function (err) {
                        if(err){
                              callback('Error : while writing file');
                        }else{
                              // close the file
                              fs.close(fileDiscriptor, function (err) {
                                    if(err){
                                          callback('Error: while closing the file');
                                    }else{
                                          callback(false); // so there was no error while the whole process of creating the file
                                    }
                              });
                        }
                  });
            }else{
                  callback('Error : could not create file it may already exist.');
            }
      });

};





// export the container (library)
module.exports = lib;