/* @flow weak */
"use strict";
var relationshipsRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


relationshipsRoute.register = function() {
  router.bindRoute({
    verb: "get",
    path: ":type/:id/relationships/:relation"
  }, function(request, resourceConfig, res) {
    var resource;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        var relation = resourceConfig.attributes[request.params.relation];
        if (!relation || !(relation._settings.__one || relation._settings.__many)) {
          return callback({
            status: "404",
            code: "ENOTFOUND",
            title: "Resource not found",
            detail: "The requested relation does not exist within the requested type"
          });
        }
        callback();
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
        sanitisedData = sanitisedData.relationships[request.params.relation].data;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        callback();
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};
