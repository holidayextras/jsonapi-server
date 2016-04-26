/* @flow weak */
"use strict";
var updateRoute = module.exports = { };

var async = require("async");
var _ = {
  assign: require("lodash.assign"),
  pick: require("lodash.pick")
};
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


updateRoute.register = function() {
  router.bindRoute({
    verb: "patch",
    path: ":type/:id"
  }, function(request, resourceConfig, res) {
    var theirResource;
    var newResource;
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
        var theirs = request.params.data;
        theirResource = _.assign({
          id: request.params.id,
          type: request.params.type
        }, theirs.attributes, { meta: theirs.meta });
        for (var i in theirs.relationships) {
          theirResource[i] = theirs.relationships[i].data;
        }
        callback();
      },
      function(callback) {
        var validationObject = _.pick(resourceConfig.onCreate, Object.keys(theirResource));
        helper.validate(theirResource, validationObject, callback);
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
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);
      router.sendResponse(res, response, 200);
    });
  });
};
