"use strict";
var jsonApi = require("../..");
var authenticationHandler = module.exports = new jsonApi.ChainHandler();

authenticationHandler.beforeSearch = function(request, callback) {
  console.log("Before Search");
  return callback();
};

authenticationHandler.afterSearch = function(results, pagination, callback) {
  console.log("After Search");
  return callback(null, results, pagination);
};

authenticationHandler.beforeInitialise = function(resourceConfig, callback) {
  console.log("Before Initialise");
  return callback(null, resourceConfig);
};
