/* @flow weak */
"use strict";
var relatedRoute = module.exports = { };

var jsonApi = require("../jsonApi.js");
var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


relatedRoute.register = function() {
  router.bindRoute({
    verb: "get",
    path: ":type/:id/:relation"
  }, function(request, resourceConfig, res) {
    var relation;
    var mainResource;
    var relatedResources;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        relation = resourceConfig.attributes[request.params.relation];
        if (!relation || !relation._settings || !(relation._settings.__one || relation._settings.__many)) {
          return callback({
            status: "404",
            code: "ENOTFOUND",
            title: "Resource not found",
            detail: "The requested relation does not exist within the requested type"
          });
        }
        if (relation._settings.__as) {
          return callback({
            status: "404",
            code: "EFOREIGN",
            title: "Relation is Foreign",
            detail: "The requested relation is a foreign relation and cannot be accessed in this manner."
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        mainResource = result;
        postProcess._fetchRelatedResources(request, mainResource, callback);
      },
      function(newResources, callback) {
        relatedResources = newResources;
        if (relation._settings.__one) {
          relatedResources = relatedResources[0];
        }
        request.resourceConfig = jsonApi._resources[relation._settings.__one || relation._settings.__many];
        response = responseHelper._generateResponse(request, resourceConfig, relatedResources);
        if (relatedResources !== null) {
          response.included = [ ];
        }
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};
