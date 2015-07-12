"use strict";
var filter = module.exports = { };

filter.action = function(request, response, callback) {
  var allFilters = request.params.filter;
  if (!allFilters) return callback();

  var filters = { };
  for (var i in allFilters) {
    if (!request.resourceConfig.attributes[i]) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid filter",
        detail: request.resourceConfig.resource + " do not have property " + i
      });
    }
    if (allFilters[i] instanceof Array) {
      allFilters[i] = allFilters[i].join(",");
    }
    if (typeof allFilters[i] === "string") {
      filters[i] = allFilters[i];
    }
  }

  if (response.data instanceof Array) {
    for (var j = 0; j < response.data.length; j++) {
      if (!filter._filterKeepObject(response.data[j], filters)) {
        response.data.splice(j, 1);
        j--;
      }
    }
  } else if (response.data instanceof Object) {
    if (!filter._filterKeepObject(response.data, filters)) {
      response.data = null;
    }
  }

  return callback();
};

filter._filterMatches = function(textToMatch, propertyText) {
  if (textToMatch[0] === ">") {
    textToMatch = textToMatch.substring(1);
    if (typeof propertyText === "number") textToMatch = parseInt(textToMatch, 10);
    if (textToMatch < propertyText) return true;
  } else if (textToMatch[0] === "<") {
    textToMatch = textToMatch.substring(1);
    if (typeof propertyText === "number") textToMatch = parseInt(textToMatch, 10);
    if (textToMatch > propertyText) return true;
  } else if (textToMatch[0] === "~") {
    if ((textToMatch.substring(1) + "").toLowerCase() === (propertyText + "").toLowerCase()) return true;
  } else if (textToMatch[0] === ":") {
    if ((propertyText + "").toLowerCase().indexOf((textToMatch.substring(1) + "").toLowerCase()) !== -1) return true;
  } else if (textToMatch === propertyText) return true;
};

filter._filterKeepObject = function(someObject, filters) {
  for (var k in filters) {
    var whitelist = filters[k].split(",");
    var propertyText = (someObject.attributes[k] || "");
    var matchOR = false;
    for (var j = 0; j < whitelist.length; j++) {
      var textToMatch = whitelist[j];
      if (filter._filterMatches(textToMatch, propertyText)) matchOR = true;
    }
    if (!matchOR) return false;
  }
  return true;
};
