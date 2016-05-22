/* @flow weak */
"use strict";
var filter = module.exports = { };


filter._resourceDoesNotHaveProperty = function(resourceConfig, key) {
  if (resourceConfig.attributes[key]) return null;
  return {
    status: "403",
    code: "EFORBIDDEN",
    title: "Invalid filter",
    detail: resourceConfig.resource + " do not have attribute or relationship '" + key + "'"
  };
};

filter._relationshipIsForeign = function(resourceConfig, key) {
  var relationSettings = resourceConfig.attributes[key]._settings;
  if (!relationSettings || !relationSettings.__as) return null;
  return {
    status: "403",
    code: "EFORBIDDEN",
    title: "Invalid filter",
    detail: "Filter relationship '" + key + "' is a foreign reference and does not exist on " + resourceConfig.resource
  };
};

filter.validateParams = function(request, callback) {
  if (!request.params.filter) return callback();

  var error;
  for (var key in request.params.filter) {
    var filterElement = request.params.filter[key];

    if (!Array.isArray(filterElement) && filterElement instanceof Object) continue;

    error = filter._resourceDoesNotHaveProperty(request.resourceConfig, key);
    if (error) return callback(error);

    error = filter._relationshipIsForeign(request.resourceConfig, key);
    if (error) return callback(error);
  }

  return callback();
};
