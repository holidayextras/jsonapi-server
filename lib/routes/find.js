/* @flow weak */
"use strict";
var findRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var filter = require("../filter.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


findRoute.register = function() {
  router.bindRoute({
    verb: "get",
    path: ":type/:id"
  }, function(request, resourceConfig, res) {
    var resource;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function parseAndValidateFilter(callback) {
        return callback(filter.parseAndValidate(request));
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        resource = result;
        postProcess.fetchForeignKeys(request, resource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(resource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        if (!sanitisedData) {
          return callback({
            status: "404",
            code: "EVERSION",
            title: "Resource is not valid",
            detail: "The requested resource does not conform to the API specification. This is usually the result of a versioning change."
          });
        }
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
