/* @flow weak */
"use strict";
var searchRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var filter = require("../filter.js");
var pagination = require("../pagination.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


searchRoute.register = function() {
  router.bindRoute({
    verb: "get",
    path: ":type"
  }, function(request, resourceConfig, res) {
    var searchResults;
    var response;
    var paginationInfo;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "search", callback);
      },
      function(callback) {
        helper.validate(request.params, resourceConfig.searchParams, callback);
      },
      function parseAndValidateFilter(callback) {
        return callback(filter.parseAndValidate(request));
      },
      function validatePaginationParams(callback) {
        pagination.validatePaginationParams(request);
        return callback();
      },
      function(callback) {
        resourceConfig.handlers.search(request, callback);
      },
      function enforcePagination(results, pageInfo, callback) {
        searchResults = pagination.enforcePagination(request, results);
        paginationInfo = pageInfo;
        return callback();
      },
      function(callback) {
        postProcess.fetchForeignKeys(request, searchResults, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnArray(searchResults, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData, paginationInfo);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};
