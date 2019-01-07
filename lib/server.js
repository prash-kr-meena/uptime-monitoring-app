'use strict';

/**
* Server related tasks
*/

//! Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');

const util = require('util');
const debug = util.debuglog('server');



// ! custom modules
const envConfig = require('../config/envConfig');
const handlers = require('./handlers');
const helpers = require('./helpers');



// TODO : get rid of this !
/* helpers.sendTwilioSms("7011380979",'hello from xxx',(err)=>{
      if(!err){
            console.log("success");
      }else{
            console.log("fuck this"+ err);
      }
}); */





// instantiate the server Moduele Object
const server = {};

// ?------------------------------------- Create HTTP server  ------------------------------------

// instantiate HTTP server
server.httpServer = http.createServer((req, res) => {
      server.unifiedServer(req, res);
});



//? ------------------------------------- Create HTTPs server  ------------------------------------

// the key and cert are basically the content of the file that we generated using the OpenSSL
// as we need there content before instantiating the server so we would need to do it synchronously
server.httpsServerOptions = {
      'key' : fs.readFileSync(path.join(__dirname,'../https/key.pem' )) ,
      'cert' :fs.readFileSync(path.join(__dirname,'../https/cert.pem'))
};

// instantiate HTTPs server
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
      debug("creating the HTTPs server  <<<<<<<<<<<<<");
      // debug(server.httpsServerOptions);
      server.unifiedServer(req, res);
});





//? -------------------------------  Unified server login  -------------------------------

// Both the http as well as the https server can use the logic of this function

server.unifiedServer = function (req, res) {
      // 1. get the url the user requested for and parse it
      let parsedUrl = url.parse(req.url, true); // --> true option is use to specify url module to call the querystring module to

      // 2. get the path
      let path = parsedUrl.pathname;
      let trimmedPath = path.replace(/^\/+|\/+$/g, '');

      // 2. get the query string as an object
      let queryStringObject = parsedUrl.query;

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
                  'queryStringObject': queryStringObject,
                  'method': method,
                  'headers': headers,
                  'payload': helpers.parseJsonToObject(buffer)
            };

            // choose the handler this request should go to
            let chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFoundHandler;

            // rout the request to the chosen handler
            chosenHandler(data, function (statusCode = 200, payload ={}) {
                  let payloadString = JSON.stringify(payload, 4, null);

                  // formalize the fact that we are sending the JSON object back to the user
                  res.setHeader('Content-Type','application/json');

                  // send the response
                  res.writeHead(statusCode);
                  res.end(payloadString);

                  // note we can perform task even after the res.end() or res.send()

                  // if the response is 200, print green otherwise print RES
                  if(statusCode === 200){
                        debug('\x1b[32m%s\x1b[0m',method+"-->  /"+trimmedPath+'   :  '+statusCode);
                  }else{
                        debug('\x1b[31m%s\x1b[0m',method+"-->  /"+trimmedPath+'   :  '+statusCode);
                  }
            });
      });
};






//? --------------------------------- Router for routing requests -----------------------------

// difining  a request router
server.router = {
      'ping' : handlers.pingHandler,
      'users' : handlers.users,
      'tokens': handlers.tokens,
      'checks' : handlers.checks
};


//! ------------     init function    --------------

server.init = function () {


      // Start the HTTP server
      server.httpServer.listen(envConfig.httpPort, () => {
            console.log('\x1b[34m%s\x1b[0m',`\n\nHTTP Server @ ${envConfig.httpPort}\t\t\tEnvironment : ${envConfig.envName}\n---------------------------------------------------------------------------------\n`);
      });


      // Start the HTTPs server
      server.httpsServer.listen(envConfig.httpsPort, () => {
            console.log('\x1b[35m%s\x1b[0m',`HTTPs Server @ ${envConfig.httpsPort}\t\t\tEnvironment : ${envConfig.envName}
            \n||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n`);
      });
};

// ? ------------------------------------------------





// Export the server module
module.exports = server;

