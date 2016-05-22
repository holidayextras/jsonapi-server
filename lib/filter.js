/* @flow weak */
"use strict";
var filter = module.exports = { };


filter.validateParams = function(request, callback) {
  if (!request.params.filter) return callback();

  for (var i in request.params.filter) {
    if (request.params.filter[i] instanceof Object) continue;
    if (!request.resourceConfig.attributes[i]) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid filter",
        detail: request.resourceConfig.resource + " do not have property " + i
      });
    }
    var relationSettings = request.resourceConfig.attributes[i]._settings;
    if (relationSettings && relationSettings.__as) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Request validation failed",
        detail: "Requested relation \"" + i + "\" is a foreign reference and does not exist on " + request.params.type
      });
    }
  }

  return callback();
};
