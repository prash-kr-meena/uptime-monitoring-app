'use strict';

/**
* primary file for the API
*/

// Dependencies
const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');



// The server should respond to all requests with a string
const server = http.createServer((req, res) => {
      console.log(req.url, " <<<<--- url string");

      // 1. get the url the user requested for and parse it
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

      // 2. get the path
      let path = parsedUrl.pathname;
      console.log(path, " <<<<<-- untrimmed path");

      let trimmedPath = path.replace(/^\/+|\/+$/g, '');
      console.log(trimmedPath, " <<<-- untrimmed");


      // 2. get the query string as an object
      let querystring = parsedUrl.query;

      // 3. identify the request method --> NOTE: curl can do get request only, for other use postman
      let method = req.method.toUpperCase();

      // 4. get the headers as an object
      let headers = req.headers;


      /*
      What is PayLoad ?

      The term 'payload' is used to distinguish between the 'interesting' information in a
      chunk of data or similar, and the overhead to support it.

      It is borrowed from transportation, where it refers to the part of the load that 'pays':
      for example, a tanker truck may carry 20 tons of oil, but the fully loaded vehicle weighs much more than that
      - there's the vehicle itself, the driver, fuel, the tank, etc.
      It costs money to move all these, but the customer only cares about (and pays for) the oil, hence, 'pay-load'.


      In programming, the most common usage of the term is in the context of message protocols,
      to differentiate the protocol overhead from the actual data.
      Take, for example, a JSON web service response that might look like this (formatted for readability):

      {
            "status":"OK",
            "data":
            {
                  "message":"Hello, world!"
            }
      }

      In this example, the string Hello, world! is the payload, the part that the recipient is
      interested in; the rest, while vital information, is protocol overhead.


      Another notable use of the term is in malware.
      Malicious software usually has two objectives: spreading itself, and performing some kind of modification on the target
      system(delete files, compromise system security, call home, etc.).
      The spreading part is the overhead, while the code that does the actual evil - doing is the payload.
      */


      // 5. get the payload, if any --> we need string_decoder module for that
      let decoder = new StringDecoder('utf-8'); // need to tell what kind of char-set/encoding it can expect
      //                                       so it can decode it using that char-set, Generally for all JSON api it will be utf-8
      let buffer = ''; // empty string

      // payload or Body that comes with an http request in the http server,  as a stream,
      // So we need to collect that stream as it comes and when the stream is at the end  we need to combine it as whole
      // so that we can figure out what the payload is. becasue as we recieve only bits of the payload we only get
      // few characters at a time, But we are intrested in what the entire payload is once it finished streaming in.


      // we can bind the function (of appending the stream into buffer) to an event that the request object emits
      // that event is called data
      let count = 0;
      req.on('data', function (data) {
            let decodedData = decoder.write(data);
            console.log(count++, " --> ", decodedData);
            buffer += decodedData;
      });

      // reeq also emits another event 'end' which tell when its done streaming
      req.on('end', () => {
            console.log("ENDING STREAM");
            buffer += decoder.end();

            // 6.  send the response
            res.end("Server Responded\n");

            // finally : log the request
            console.log("\n\nurl requested  on : ", trimmedPath,
            " with method ", method,
            "\nand with these query String parameters:", querystring,
            "\n request reciever with these headers :\n ", JSON.stringify(headers, null, 4),
            "\n\n with payload : " , JSON.stringify(buffer, null, 4));

            // Test :  curl localhost:3000/webpath?foo=bar&abc=xyz&abc=123
      });

      // THe Big Question , So not every request has a payload/body eg. GET then woud the 'end' event would be called???
      //  YES, the 'end'  will be called doesn't matter if there is a payload or not.
      // if there is no payload the 'data' event will not be called
      // in that case the buffer will be initialized with the empty string and nothing is going to get appended to it.
      // and its still going to be ended and we will still be able to send the response


      /*
      Node.js deals heavily with streams

      You can think of it basically as a pipe with a flow of water in it where the water is actually data
      and the pipe is the stream. I suppose it's kind of a 2-way pipe if the stream is bi-directional.
      It's basically a common abstraction that is placed upon things where there is a flow or
      sequence of data in one or both directions.

      common thing you might find is textual streams that allow you to write strings instead of bytes,
      or some languages provide binary streams that allow you to write primitive types.

      A common thing you'll find in textual streams is a character encoding,
      */

});



// Start the server, and have it listen on port 3000
server.listen(3000, () => {
      console.log("Server Started");
});
// this will keep the node.js event-loop busy by telling, it always have something new to do,
// which is continue to listen on port 3000, so inorder to stop we would need to proactively kill the server