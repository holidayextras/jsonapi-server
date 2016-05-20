"use strict";
var server = module.exports = { };

var jsonApi = require("../.");
var fs = require("fs");
var path = require("path");

process.title = "jsonapi-server";

jsonApi.setConfig({
  swagger: {
    title: "Apple DP JSON:API Server",
    version: "0.1.1",
    description: "Apple Rest API for RPP and DP management.",
    contact: {
      name: "API Contact",
      email: "akirka@gmail.com",
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
  base: "1",
  meta: {
    description: "Apple Rest API for RPP and DP management payload."
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

jsonApi.start();
server.start = jsonApi.start;
server.close = jsonApi.close;
