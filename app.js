'use strict';

/**
* primary file for the API
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');

const envConfig = require('./envConfig');
const _data = require('./lib/data');

// ------------------------------------- TEST  ------------------------------------
// Todo : Delete this from app.js

let testData = {'name' : "prashant", 'rollNo' : 314, 'age' : 22};

_data.create('test', 'user', testData, function(err){
      if(err){
            console.log(err);
      }
});

_data.read('test', 'user',function (err, data) {
      if(err){
            console.log(err);
      }else{
            // console.log(typeof data); --> 'string'
            data = JSON.parse(data);
            console.log(data);
      }
});



// -------------------------------------  HTTP server  ------------------------------------

// instantiate HTTP server
const httpServer = http.createServer((req, res) => {
      unifiedServer(req, res);
});


// Start the HTTP server
httpServer.listen(envConfig.httpPort, () => {
      console.log(`\n\nHTTP Server @ ${envConfig.httpPort}\t\t\tEnvironment : ${envConfig.envName}\n---------------------------------------------------------------------------------\n`);
});



// -------------------------------------  HTTPs server  ------------------------------------

// the key and cert are basically the content of the file that we generated using the OpenSSL
// as we need there content before instantiating the server so we would need to do it synchronously
let httpsServerOptions = {
      'key' : fs.readFileSync('./https/key.pem') ,
      'cert' :fs.readFileSync('./https/cert.pem')
};

// instantiate HTTPs server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
      console.log("creating the HTTPs server  <<<<<<<<<<<<<");
      unifiedServer(req, res);
});


// Start the HTTPs server
httpsServer.listen(envConfig.httpsPort, () => {
      console.log(`HTTPs Server @ ${envConfig.httpsPort}\t\t\tEnvironment : ${envConfig.envName}
      \n||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n`);
});


// -------------------------------  Unified server login  -------------------------------

// Both the http as well as the https server can use the logic of this function

let unifiedServer = function (req, res) {
      // 1. get the url the user requested for and parse it
      let parsedUrl = url.parse(req.url, true); // --> true option is use to specify url module to call the querystring module to


      // 2. get the path
      let path = parsedUrl.pathname;
      let trimmedPath = path.replace(/^\/+|\/+$/g, '');

      // 2. get the query string as an object
      let querystringObject = parsedUrl.query;

      // 3. identify the request method --> NOTE: curl can do get request only, for other use postman
      let method = req.method.toUpperCase();

      // 4. get the headers as an object
      let headers = req.headers;


      // 5. get the payload, if any --> we need string_decoder module for that
      let decoder = new StringDecoder('utf-8'); // need to tell what kind of char-set/encoding it can expect
      //                                       so it can decode it using that char-set, Generally for all JSON api it will be utf-8
      let buffer = ''; // empty string

      req.on('data', function (data) {
            let decodedData = decoder.write(data);
            buffer += decodedData;
      });

      // reeq also emits another event 'end' which tell when its done streaming
      req.on('end', () => {
            buffer += decoder.end();

            // construct the data object need to be sent to the user
            let data = {
                  'trimmedPath': trimmedPath,
                  'querystringObject': querystringObject,
                  'method': method,
                  'headers': headers,
                  'payload': buffer
            };

            // choose the handler this request should go to
            let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handler.notFoundHandler;

            // rout the request to the chosen handler
            chosenHandler(data, function (statusCode = 200, payload ={}) {
                  let payloadString = JSON.stringify(payload, 4, null);

                  // formalize the fact that we are sending the JSON object back to the user
                  res.setHeader('Content-Type','application/json');

                  // send the response
                  res.writeHead(statusCode);
                  res.end(payloadString);

                  // note we can perform task even after the res.end() or res.send()
                  console.log("Returning this response : ", payloadString, '\n\n');
            });
      });
};


// ------------------------------------ Server Request Handler ---------------------------------

// difining the request handlers
const handler = {};


// not-found handler
handler.notFoundHandler = function (data, callback) {
      console.log("notFoundHandler <<----- handled the request");
      callback(400);
};


handler.pingHandler = function (data, callback) {
      console.log("pingHandler <<----- handled the request");
      callback(200);
};

// --------------------------------- Router for routing requests -----------------------------

// difining  a request router
const router = {
      'ping' : handler.pingHandler,
};

// -------------------------------------------------------------------------------------




/**
* we are going to write data into the files,
* we are going to use file system as the key-value of different json file
*
* but we need a library in order to do that --> we need to create this library byourselves
*/