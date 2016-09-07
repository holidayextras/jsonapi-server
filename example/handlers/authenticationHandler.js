"use strict";
var jsonApi = require("../..");
var authenticationHandler = module.exports = new jsonApi.ChainHandler();

authenticationHandler.beforeSearch = function(request, callback) {
  console.log("Before Search 1");
  return callback(null, request);
};

authenticationHandler.afterSearch = function(results, pagination, callback) {
  console.log("After Search 1");
  return callback(null, results, pagination);
};

authenticationHandler.beforeInitialise = function(resourceConfig, callback) {
  console.log("Before Initialise 1");
  return callback(null, resourceConfig);
};
