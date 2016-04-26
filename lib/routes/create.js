/* @flow weak */
"use strict";
var createRoute = module.exports = { };

var async = require("async");
var _ = {
  assign: require("lodash.assign")
};
var uuid = require("node-uuid");
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


createRoute.register = function() {
  router.bindRoute({
    verb: "post",
    path: ":type"
  }, function(request, resourceConfig, res) {
    var theirResource;
    var newResource;
    var response;

    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "create", callback);
      },
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        helper.checkForBody(request, callback);
      },
      function(callback) {
        var theirs = request.params.data;
        theirResource = _.assign({
          id: uuid.v4(),
          type: request.params.type
        }, theirs.attributes, { meta: theirs.meta });
        for (var i in theirs.relationships) {
          theirResource[i] = theirs.relationships[i].data;
        }
        helper.validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.create(request, theirResource, callback);
      },
      function(result, callback) {
        newResource = result;
        request.params.id = newResource.id;
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
        request.route.path += "/" + newResource.id;
        res.set({
          "Location": request.route.combined + "/" + newResource.id
        });
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      return router.sendResponse(res, response, 201);
    });
  });
};
