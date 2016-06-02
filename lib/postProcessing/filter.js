/* @flow weak */
"use strict";
var filter = module.exports = { };

var _ = {
  assign: require("lodash.assign"),
  isEqual: require("lodash.isequal")
};
var debug = require("../debugging.js");

filter.action = function(request, response, callback) {
  var filters = request.processedFilter;
  if (!filters) return callback();

  if (response.data instanceof Array) {
    for (var j = 0; j < response.data.length; j++) {
      if (!filter._filterKeepObject(response.data[j], filters)) {
        debug.filter("removed", filters, JSON.stringify(response.data[j].attributes));
        response.data.splice(j, 1);
        j--;
      }
    }
  } else if (response.data instanceof Object) {
    if (!filter._filterKeepObject(response.data, filters)) {
      debug.filter("removed", filters, JSON.stringify(response.data.attributes));
      response.data = null;
    }
  }

  return callback();
};

filter._filterMatches = function(filterElement, attributeValue) {
  if (!filterElement.operator) {
    return _.isEqual(attributeValue, filterElement.value);
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

filter._filterKeepObject = function(someObject, filters) {
  for (var filterName in filters) {
    var whitelist = filters[filterName];

    if (someObject.attributes.hasOwnProperty(filterName) || (filterName === "id")) {
      var attributeValue = someObject.attributes[filterName];
      if (filterName === "id") attributeValue = someObject.id;
      var attributeMatches = filter._attributesMatchesOR(attributeValue, whitelist);
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

filter._attributesMatchesOR = function(attributeValue, whitelist) {
  var matchOR = false;
  whitelist.forEach(function(filterElement) {
    if (filter._filterMatches(filterElement, attributeValue)) {
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

  whitelist.forEach(function(filterElement) {
    if (data.indexOf(filterElement.value) !== -1) {
      matchOR = true;
    }
  });
  return matchOR;
};
