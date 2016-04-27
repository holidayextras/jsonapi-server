/* @flow weak */
"use strict";
var deleteRoute = module.exports = { };

var async = require("async");
var helper = require("./helper.js");
var router = require("../router.js");
var responseHelper = require("../responseHelper.js");


deleteRoute.register = function() {
  router.bindRoute({
    verb: "delete",
    path: ":type/:id"
  }, function(request, resourceConfig, res) {
    async.waterfall([
      function(callback) {
        helper.verifyRequest(request, resourceConfig, res, "delete", callback);
      },
      function(callback) {
        resourceConfig.handlers.delete(request, callback);
      }
    ], function(err) {
      if (err) return helper.handleError(request, res, err);

      var response = {
        meta: responseHelper._generateMeta(request)
      };
      router.sendResponse(res, response, 200);
    });
  });
};
