'use strict';

/**
* primary file for the API
*/

// Dependencies
const http = require('http');



// The server should respond to all requests with a string
const server = http.createServer((req, res) => {
      res.end("Server Responded\n");
});
// Test -->     curl localhost:3000





// Start the server, and have it listen on port 3000
server.listen(3000, () => {
      console.log("Server Started");
});
// this will keep the node.js event-loop busy by telling, it always have something new to do,
// which is continue to listen on port 3000, so inorder to stop we would need to proactively kill the server