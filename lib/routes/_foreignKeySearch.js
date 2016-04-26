/* @flow weak */
"use strict";
var foreignKeySearchRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


foreignKeySearchRoute.register = function() {
  router.bindRoute({
    verb: "get",
    path: ":type/relationships/?"
  }, function(request, resourceConfig, res) {
    var foreignKey;
    var searchResults;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "search", callback);
      },
      function(callback) {
        foreignKey = Object.keys(request.params).filter(function(param) {
          return ["include", "type", "sort", "filter", "fields", "requestId"].indexOf(param) === -1;
        }).pop();
        request.params.relationships = { };
        request.params.relationships[foreignKey] = request.params[foreignKey];
        delete request.params[foreignKey];
        callback();
      },
      function(callback) {
        var foreignKeySchema = resourceConfig.attributes[foreignKey];
        if (!foreignKeySchema || !foreignKeySchema._settings) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Invalid foreign key lookup",
            detail: "Relation [" + foreignKey + "] does not exist within " + request.params.type
          });
        }
        if (!(foreignKeySchema._settings.__one || foreignKeySchema._settings.__many)) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Invalid foreign key lookup",
            detail: "Attribute [" + foreignKey + "] does not represent a relation within " + request.params.type
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.search(request, callback);
      },
      function(results, pageData, callback) {
        searchResults = results.map(function(result) {
          return {
            id: result.id,
            type: result.type
          };
        });
        if (resourceConfig.attributes[foreignKey]) {
          searchResults = searchResults[0] || null;
        }
        callback();
      },
      function(callback) {
        response = responseHelper._generateResponse(request, resourceConfig, searchResults);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};
