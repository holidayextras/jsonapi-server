"use strict";
var searchRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


searchRoute.register = function() {
  router.bindToServer({
    verb: "get",
    path: ":type"
  }, function(request, resourceConfig, res) {
    var searchResults;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "search", callback);
      },
      function(callback) {
        helper.validate(request.params, resourceConfig.searchParams, callback);
      },
      function(callback) {
        resourceConfig.handlers.search(request, callback);
      },
      function(results, callback) {
        searchResults = results;
        postProcess.fetchForeignKeys(request, searchResults, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnArray(searchResults, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};
