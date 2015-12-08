"use strict";
var searchRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
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
      function validationRelationshipParams(callback) {
        if (!request.params.relationships) return callback();

        var target = Object.keys(request.params.relationships)[0];
        var relation = resourceConfig.attributes[target];

        if (!relation || !relation._settings || !(relation._settings.__one || relation._settings.__many)) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Requested relation \"" + target + "\" does not exist on " + request.params.type
          });
        }

        if (relation._settings.__as) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Requested relation \"" + target + "\" is a foreign reference and does not exist on " + request.params.type
          });
        }

        return callback();
      },
      function validateFilterParams(callback) {
        var allFilters = request.params.filter;
        if (!allFilters) return callback();

        var filters = { };
        for (var i in allFilters) {
          if (!request.resourceConfig.attributes[i]) {
            return callback({
              status: "403",
              code: "EFORBIDDEN",
              title: "Invalid filter",
              detail: request.resourceConfig.resource + " do not have property " + i
            });
          }
          if (allFilters[i] instanceof Array) {
            allFilters[i] = allFilters[i].join(",").split(",");
          }
          filters[i] = allFilters[i];
        }

        request.params.filter = filters;
        return callback();
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
