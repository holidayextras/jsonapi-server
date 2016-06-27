"use strict";
var server = module.exports = { };

var jsonApi = require("../.");
var fs = require("fs");
var path = require("path");
var debug = require("debug");

jsonApi.setConfig({
  swagger: {
    title: "Example JSON:API Server",
    version: "0.1.1",
    description: "This is the API description block that shows up in the swagger.json",
    contact: {
      name: "API Contact",
      email: "apicontact@holidayextras.com",
      url: "docs.hapi.holidayextras.com"
    },
    license: {
      name: "MIT",
      url: "http://opensource.org/licenses/MIT"
    }
  },
  protocol: "http",
  hostname: "localhost",
  port: 16006,
  base: "rest",
  meta: {
    description: "This block shows up in the root node of every payload"
  }
});

jsonApi.authenticate(function(request, callback) {
  // If a "blockMe" header is provided, block access.
  if (request.headers.blockme) return callback("Fail");

  // If a "blockMe" cookie is provided, block access.
  if (request.cookies.blockMe) return callback("Fail");

  return callback();
});

fs.readdirSync(path.join(__dirname, "/resources")).filter(function(filename) {
  return /^[a-z].*\.js$/.test(filename);
}).map(function(filename) {
  return path.join(__dirname, "/resources/", filename);
}).forEach(require);

jsonApi.onUncaughtException(function(request, error) {
  var errorDetails = error.stack.split("\n");
  console.error(JSON.stringify({
    request: request,
    error: errorDetails.shift(),
    stack: errorDetails
  }));
});

jsonApi.metrics.on("data", function(data) {
  debug("metrics")(data);
});

// If we're using the example server for the test suite,
// wait for the tests to call .start();
if (typeof describe === "undefined") {
  jsonApi.start();
}
server.start = jsonApi.start;
server.close = jsonApi.close;
server.getExpressServer = jsonApi.getExpressServer;
