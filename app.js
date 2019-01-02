'use strict';

/**
* primary file for the API
*/

// Dependencies
const http = require('http');
const url = require('url');
// const { StringDecoder } = require('string_decoder');
const StringDecoder = require('string_decoder').StringDecoder;



// The server should respond to all requests with a string
const server = http.createServer((req, res) => {
      // 1. get the url the user requested for and parse it
      let parsedUrl = url.parse(req.url, true); // --> true option is use to specify url module to call the querystring module to
      console.log(parsedUrl); //                       in order to get the parsed Url object,


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

            /* at this point we have got everything that the user might have sent us
            we know the path that they requested for
            we know the queryString that they might have sent us,
            we know which http method by which they are sending the request
            we know the hearders that thet are sending.
            we know the payload that they are sending, if any
            so we have all the data we need to process the user requeset
            --> for now we just want to pacakge it in an object and send/route it to an request handler

            SO we need to define some request handlers, and set-up a routing structure ie a router
            so that this http server can look at the request and route it to the handler it needs to go to
            */

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
                  statusCode = typeof (statusCode === 'number') ? statusCode : 200;
                  payload = typeof (payload === 'object') ? payload : {};
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
                  console.log("\nReturning this response : ", payloadString);
            });
      });
});


// -------------------------------------------------------------------------------------

// difining the request handlers
const handler = {};

// about handler
handler.aboutHandler = function (data, callback) {
      console.log("aboutHandler <<-- handled the request");
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
      console.log("notFoundHandler <<-- handled the request");
      callback(400);
};

// -------------------------------------------------------------------------------------

// difining  a request router
const router = {
      'about': handler.aboutHandler
};


// -------------------------------------------------------------------------------------

// Start the server, and have it listen on port 3000
server.listen(3000, () => {
      console.log("Server Started");
});
// this will keep the node.js event-loop busy by telling, it always have something new to do,
// which is continue to listen on port 3000, so inorder to stop we would need to proactively kill the server


// -------------------------------------------------------------------------------------
