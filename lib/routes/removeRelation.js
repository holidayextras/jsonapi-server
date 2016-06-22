/* @flow weak */
"use strict";
var removeRelationRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


removeRelationRoute.register = function() {
  router.bindRoute({
    verb: "delete",
    path: ":type/:id/relationships/:relation"
  }, function(request, resourceConfig, res) {
    var newResource;
    var theirResource;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "update", callback);
      },
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        helper.checkForBody(request, callback);
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(ourResource, callback) {
        theirResource = ourResource;

        var isMany = resourceConfig.attributes[request.params.relation]._settings.__many;
        var theirs = request.params.data;
        if (!(theirs instanceof Array)) {
          theirs = [ theirs ];
        }

        var keys = theirResource[request.params.relation].map(function(j) {
          return j.id;
        });

        for (var i = 0; i < theirs.length; i++) {
          if (theirs[i].type !== request.params.relation) {
            return callback({
              status: "403",
              code: "EFORBIDDEN",
              title: "Invalid Request",
              detail: "Invalid type " + theirs[i].type
            });
          }
          var someId = theirs[i].id;
          var indexOfTheirs = keys.indexOf(someId);
          if (indexOfTheirs === -1) {
            return callback({
              status: "403",
              code: "EFORBIDDEN",
              title: "Invalid Request",
              detail: "Unknown id " + someId
            });
          }
          if (isMany) {
            theirResource[request.params.relation].splice(indexOfTheirs, 1);
          }
        }

        if (!isMany) {
          theirResource[request.params.relation] = null;
        }

        helper.validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.update(request, theirResource, callback);
      },
      function(result, callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        newResource = result;
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        sanitisedData = sanitisedData.relationships[request.params.relation].data;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      router.sendResponse(res, response, 200);
    });
  });
};
