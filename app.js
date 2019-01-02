'use strict';

/**
* primary file for the API
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const envConfig = require('./envConfig');
const fs = require('fs');

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

// Both the http as well as the https server can use the logic of this function,
// rather then doing the same twice.
// ---> SO in reality the both are working the same way its just that they both are on different ports

let unifiedServer = function (req, res) {
      // 1. get the url the user requested for and parse it
      let parsedUrl = url.parse(req.url, true); // --> true option is use to specify url module to call the querystring module to
      // console.log(parsedUrl); //                       in order to get the parsed Url object,


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

            // typeof is an operator that always returns a string, describing the type of a value. ---> IMPORTANT

            // rout the request to the chosen handler
            chosenHandler(data, function (statusCode = 200, payload ={}) {
                  /* setting up default values in case the handler doesn't return one.
                  it is similar to :
                  statusCode = typeof (statusCode) === 'number' ? statusCode : 200;
                  payload = typeof (payload) === 'object' ? payload : {};
                  */
                  // now we can't send an object to the user, so we convert this object into string and send it
                  let payloadString = JSON.stringify(payload, 4, null);

                  // formalize the fact that we are sending the JSON object back to the user
                  // ie we want to tell the user, that its going to get JSON,
                  // so browser or anybody like postman will understand that we are sending JSON and parse it that way.
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

// about handler
handler.aboutHandler = function (data, callback) {
      console.log("aboutHandler <<----- handled the request");
      callback(202, { name: "about handler" });
};
/* so each of these handlers is going to be getting a big-block of data, which we collected above from the user.
We are also goint to send it a callback, and we want the handler to call the call-back when done handling the request.
and tell us 2 things.
1. we want to callback a http status collected
2. and a payload, and that should be an object. (we are choosing it to be object, because we are making this handler to work exclusively with json, ie JSON api's. But if we want we could return anything, number, string etc.)
*/
// not-found handler
handler.notFoundHandler = function (data, callback) {
      console.log("notFoundHandler <<----- handled the request");
      callback(400);
};



// so we need to add a route 'ping' for the request '/ping' ---> it will simply call the callback with 200
// purpose of this route is just so,
// --> you can moinitor your application and easily find out if it is alive or not
// and hence it is also very usefull for uptime monitoring: SO if this application was being monitored by another uptime monitor, the '/ping' route is probably the one we give , as the '/ping' route does not have any  effect on the server all it does is, callback 200 and say i am still alive.

handler.pingHandler = function (data, callback) {
      console.log("pingHandler <<----- handled the request");
      callback(200);
};

// --------------------------------- Router for routing requests -----------------------------

// difining  a request router
const router = {
      'about': handler.aboutHandler,
      'ping' : handler.pingHandler,
};

// -------------------------------------------------------------------------------------
