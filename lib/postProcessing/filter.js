/* @flow weak */
"use strict";
var filter = module.exports = { };

var _ = {
  assign: require("lodash.assign"),
  isEqual: require("lodash.isequal")
};
var debug = require("../debugging.js");

var FILTER_OPERATORS = ["<", ">", "~", ":"];

filter.action = function(request, response, callback) {
  var allFilters = _.assign({ }, request.params.filter);
  if (!allFilters) return callback();

  var filters = { };
  for (var i in allFilters) {
    if (allFilters[i] instanceof Array) {
      allFilters[i] = allFilters[i].join(",");
    }
    if (typeof allFilters[i] === "string") {
      filters[i] = allFilters[i];
    }
  }

  if (response.data instanceof Array) {
    for (var j = 0; j < response.data.length; j++) {
      if (!filter._filterKeepObject(response.data[j], filters, request.resourceConfig.attributes)) {
        debug.filter("removed", filters, JSON.stringify(response.data[j].attributes));
        response.data.splice(j, 1);
        j--;
      }
    }
  } else if (response.data instanceof Object) {
    if (!filter._filterKeepObject(response.data, filters, request.resourceConfig.attributes)) {
      debug.filter("removed", filters, JSON.stringify(response.data.attributes));
      response.data = null;
    }
  }

  return callback();
};

filter._splitFilterElement = function(filterElementStr) {
  if (FILTER_OPERATORS.indexOf(filterElementStr[0]) !== -1) {
    return { operator: filterElementStr[0], value: filterElementStr.substring(1) };
  }
  return { operator: null, value: filterElementStr };
};

filter._filterMatches = function(filterElementStr, attributeValue, attributeConfig) {
  var filterElement = filter._splitFilterElement(filterElementStr);
  var validationResult = attributeConfig.validate(filterElement.value);
  if (validationResult.error) {
    debug.filter("invalid filter condition value:", validationResult.error);
    return false;
  }
  filterElement.value = validationResult.value;
  if (!filterElement.operator) {
    return _.isEqual(attributeValue, filterElement.value);
  }
  if (["~", ":"].indexOf(filterElement.operator) !== -1 && typeof filterElement.value !== "string") {
    return false;
  }
  var filterFunction = {
    ">": function filterGreaterThan(attrValue, filterValue) {
      return attrValue > filterValue;
    },
    "<": function filterLessThan(attrValue, filterValue) {
      return attrValue < filterValue;
    },
    "~": function filterCaseInsensitiveEqual(attrValue, filterValue) {
      return attrValue.toLowerCase() === filterValue.toLowerCase();
    },
    ":": function filterCaseInsensitiveContains(attrValue, filterValue) {
      return attrValue.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1;
    }
  }[filterElement.operator];
  var result = filterFunction(attributeValue, filterElement.value);
  return result;
};

filter._filterKeepObject = function(someObject, filters, attributesConfig) {
  for (var filterName in filters) {
    var whitelist = filters[filterName].split(",");
    var attributeConfig = attributesConfig[filterName];

    if (someObject.attributes.hasOwnProperty(filterName) || (filterName === "id")) {
      var attributeValue = someObject.attributes[filterName];
      if (filterName === "id") attributeValue = someObject.id;
      var attributeMatches = filter._attributesMatchesOR(attributeValue, attributeConfig, whitelist);
      if (!attributeMatches) return false;
    } else if (someObject.relationships.hasOwnProperty(filterName)) {
      var relationships = someObject.relationships[filterName];
      var relationshipMatches = filter._relationshipMatchesOR(relationships, whitelist);
      if (!relationshipMatches) return false;
    } else {
      return false;
    }
  }
  return true;
};

filter._attributesMatchesOR = function(attributeValue, attributeConfig, whitelist) {
  var matchOR = false;
  whitelist.forEach(function(filterElementStr) {
    if (filter._filterMatches(filterElementStr, attributeValue, attributeConfig)) {
      matchOR = true;
    }
  });
  return matchOR;
};

filter._relationshipMatchesOR = function(relationships, whitelist) {
  var matchOR = false;

  var data = relationships.data;
  if (!data) return false;

  if (!(data instanceof Array)) data = [ data ];
  data = data.map(function(relation) {
    return relation.id;
  });

  whitelist.forEach(function(filterElementStr) {
    if (data.indexOf(filterElementStr) !== -1) {
      matchOR = true;
    }
  });
  return matchOR;
};
