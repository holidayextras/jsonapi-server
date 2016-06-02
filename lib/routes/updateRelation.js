/* @flow weak */
"use strict";
var updateRelationRoute = module.exports = { };

var async = require("async");
var _ = {
  assign: require("lodash.assign"),
  pick: require("lodash.pick")
};
var helper = require("./helper.js");
var router = require("../router.js");
var postProcess = require("../postProcess.js");
var responseHelper = require("../responseHelper.js");


updateRelationRoute.register = function() {
  router.bindRoute({
    verb: "patch",
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
        var theirs = request.params.data;
        theirResource = _.assign({
          id: request.params.id,
          type: request.params.type
        });
        theirResource[request.params.relation] = theirs;
        var validator = _.pick(resourceConfig.onCreate, [ "id", "type", request.params.relation]);
        helper.validate(theirResource, validator, callback);
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
