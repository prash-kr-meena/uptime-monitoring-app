'use strict';

/**
* primary file for the API
*/

// Dependencies
const http = require('http');
const url = require('url');



// The server should respond to all requests with a string
const server = http.createServer((req, res) => {
      console.log(req.url, " <<<<--- url string");

      // get the url the user requested for and parse it
      let parsedUrl = url.parse(req.url, true); // --> true option is use to specify url module to call the querystring module to
      console.log(parsedUrl); //                       in order to get the parsed Url object,



      /*  The querystring module provides utilities for parsing and formatting URL query strings.
      It can be accessed using ---->   const querystring = require('querystring');

      querystring.parse(str[, sep[, eq[, options]]])  <<<-----

      str <string> The URL query string to parse
      sep <string> The substring used to delimit key and value pairs in the query string. Default: '&'.
      eq <string>. The substring used to delimit keys and values in the query string. Default: '='.
      options <Object>

      The querystring.parse() method parses a URL query string (str) into a collection of key and value pairs.

      For example,  --->>> the query string   'foo=bar&abc=xyz&abc=123'  is parsed into:

      {
            foo: 'bar',
            abc: ['xyz', '123']
      }

      The object returned by the querystring.parse() method does not prototypically inherit from the JavaScript Object.
      This means that typical Object methods such as
      obj.toString(), obj.hasOwnProperty(), and others are not defined and will not work.

      */

      // get the path
      let path = parsedUrl.pathname;
      console.log(path, " <<<<<-- untrimmed path");

      let trimmedPath = path.replace(/^\/+|\/+$/g, '');
      console.log(trimmedPath, " <<<-- untrimmed");


      // get the query string as an object
      let querystring = parsedUrl.query;

      // send the response
      res.end("Server Responded\n");

      // identify the request method --> NOTE: curl can do get request only, for other use postman
      let method = req.method.toUpperCase();

      // log the request
      console.log("\n\nurl requested  on : ", trimmedPath, " with method ", method, "\nand with these query String parameters:", querystring);

      // Test :  curl localhost:3000/webpath?foo=bar&abc=xyz&abc=123
});



// Start the server, and have it listen on port 3000
server.listen(3000, () => {
      console.log("Server Started");
});
// this will keep the node.js event-loop busy by telling, it always have something new to do,
// which is continue to listen on port 3000, so inorder to stop we would need to proactively kill the server