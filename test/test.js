'use strict';

/**
 *    Test for CRUD operations for file
*/



// dependencies
const _data = require('./../lib/data');
const helpers =require('./../lib/helpers');



// ------------------------------------- TEST  ------------------------------------
// Todo : Delete this from app.js

let testData = {'name' : "prashant", 'rollNo' : 314, 'age' : 22};


console.log('1.  creating the file and writing data');
_data.create('test', 'user', testData, function(err){
      if(err){
            console.log(err);
      }else{

            console.log('2. reading the data from file');
            _data.read('test', 'user',function (err, data) {
                  if(err){
                        console.log(err);
                  }else{
                        // console.log(typeof data); --> 'string'
                        data = helpers.parseJsonToObject(data);
                        console.log(data);

                        console.log('3. updaing the file and writing data to it');
                        _data.update('test', 'user', {foo:'bar'}, function(err){
                              if(err){
                                    console.log(err);
                              }else{
                                    console.log('4. deleting the file -- unlinking');
                                    _data.delete('test', 'user', function(err){
                                          if(err){
                                                console.log(err);
                                          }
                                    });
                              }
                        });
                  }
            });
      }
});