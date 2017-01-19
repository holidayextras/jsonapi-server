"use strict";
var server = module.exports = { };

var jsonApi = require("../.");
var fs = require("fs");
var path = require("path");
var ldap_auth = require("./ldap_auth");

process.title = "jsonapi-server";

jsonApi.setConfig({
  swagger: {
    title: "Apple DP JSON:API Server",
    version: "0.1.1",
    description: "Apple Rest API for RPP and DP management.",
    contact: {
      name: "API Contact",
      email: "akirka@gmail.com",
      url: "megawin-corp.com"
    },
    license: {
      name: "Copyright Protected",
      url: ""
    }
  },
  protocol: "https",
  tls: {
    cert: fs.readFileSync('/etc/ssl/rpp_server.crt'),
    key: fs.readFileSync('/etc/ssl/rpp_server.key'),
    passphrase: 'charger.'
  },
  hostname: process.env.HOSTNAME,
  port: 16006,
  base: "1",
  meta: {
    description: "Apple Rest API for RPP and DP management payload."
  }
});

jsonApi.authenticate(function(request, callback) {

  //Allow the request for the swagger.json as it should not be protected resource.
   if (request.route.path.toLowerCase() == "swagger.json") return callback();
  //Check for authorization header.
  if (request.headers.hasOwnProperty('authorization') == false) return callback("Fail");

  // If a "blockMe" header is provided, block access.
  if (request.headers.blockme) return callback("Fail");

  // If a "blockMe" cookie is provided, block access.
  if (request.cookies.blockMe) return callback("Fail");

  //Check the authorization header to see if it is ok with ldap.
  ldap_auth.authorize(request.headers.authorization, function (statusCode, response) {

    if (statusCode != 200) return callback("Fail");

    //Ok, the user is authorized.
    return callback();
  });

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
