"use strict";
var server = module.exports = { };

var jsonApi = require("../.");
var fs = require("fs");
var path = require("path");

jsonApi.setConfig({
  base: "rest",
  port: 16006,
  meta: {
    copyright: "Blah"
  }
});

fs.readdirSync(path.join(__dirname, "/resources")).filter(function(filename) {
  return /^[a-z].*\.js$/.test(filename);
}).map(function(filename) {
  return path.join(__dirname, "/resources/", filename);
}).forEach(require);

jsonApi.onError(function(request, error) {
  var errorDetails = error.stack.split("\n");
  console.error(JSON.stringify({
    request: request,
    error: errorDetails.shift(),
    stack: errorDetails
  }));
});

jsonApi.start();
server.start = jsonApi.start;
server.close = jsonApi.close;
