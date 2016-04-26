/* @flow weak */
"use strict";
var sort = module.exports = { };

sort.action = function(request, response, callback) {
  var attribute = request.params.sort;
  var ascending = 1;
  if (!attribute) return callback();
  attribute = ("" + attribute);
  if (attribute[0] === "-") {
    ascending = -1;
    attribute = attribute.substring(1, attribute.length);
  }

  if (!request.resourceConfig.attributes[attribute]) {
    return callback({
      status: "403",
      code: "EFORBIDDEN",
      title: "Invalid sort",
      detail: request.resourceConfig.resource + " do not have property " + attribute
    });
  }

  response.data = response.data.sort(function(a, b) {
    if (typeof a.attributes[attribute] === "string") {
      return a.attributes[attribute].localeCompare(b.attributes[attribute]) * ascending;
    } else if (typeof a.attributes[attribute] === "number") {
      return (a.attributes[attribute] - b.attributes[attribute]) * ascending;
    } else {
      return 0;
    }
  });

  return callback();
};
