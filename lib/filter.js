/* @flow weak */
"use strict";
var filter = module.exports = { };


var FILTER_OPERATORS = ["<", ">", "~", ":"];
var STRING_ONLY_OPERATORS = ["~", ":"];


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

filter._splitElement = function(element) {
  if (!element) return null;
  if (FILTER_OPERATORS.indexOf(element[0]) !== -1) {
    return { operator: element[0], value: element.substring(1) };
  }
  return { operator: null, value: element };
};

filter._stringOnlyOperator = function(operator, attributeConfig) {
  if (!operator || !attributeConfig) return null;
  if (STRING_ONLY_OPERATORS.indexOf(operator) !== -1 && attributeConfig._type !== "string") {
    return "operator " + operator + " can only be applied to string attributes";
  }
  return null;
};

filter._parseScalarFilterElement = function(attributeConfig, scalarElement) {
  if (!scalarElement) return { error: "invalid or empty filter element" };

  var splitElement = filter._splitElement(scalarElement);
  if (!splitElement) return { error: "empty filter" };

  var error = filter._stringOnlyOperator(splitElement.operator, attributeConfig);
  if (error) return { error: error };

  if (attributeConfig._settings) {  // relationship attribute: no further validation
    return { result: splitElement };
  }

  var validateResult = attributeConfig.validate(splitElement.value);
  if (validateResult.error) {
    return { error: validateResult.error.message };
  }

  var validatedElement = { operator: splitElement.operator, value: validateResult.value };
  return { result: validatedElement };
};

filter._parseFilterElementHelper = function(attributeConfig, filterElement) {
  if (!filterElement) return { error: "invalid or empty filter element" };

  var parsedElements = [].concat(filterElement).map(function(scalarElement) {
    return filter._parseScalarFilterElement(attributeConfig, scalarElement);
  });

  if (parsedElements.length === 1) return parsedElements[0];

  var errors = parsedElements.reduce(function(combined, element) {
    if (!combined) {
      if (!element.error) return combined;
      return [ element.error ];
    }
    return combined.concat(element.error);
  }, null);

  if (errors) return { error: errors };

  var results = parsedElements.map(function(element) {
    return element.result;
  });

  return { result: results };
};

filter._parseFilterElement = function(attributeName, attributeConfig, filterElement) {
  var helperResult = filter._parseFilterElementHelper(attributeConfig, filterElement);

  if (helperResult.error) {
    return {
      error: {
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid filter",
        detail: "Filter value for key '" + attributeName + "' is invalid: " + helperResult.error
      }
    };
  }
  return { result: helperResult.result };
};

filter.parseAndValidate = function(request) {
  if (!request.params.filter) return null;

  var resourceConfig = request.resourceConfig;

  var processedFilter = { };
  var error;
  var filterElement;
  var parsedFilterElement;

  for (var key in request.params.filter) {
    filterElement = request.params.filter[key];

    if (!Array.isArray(filterElement) && filterElement instanceof Object) continue;  // skip deep filters

    error = filter._resourceDoesNotHaveProperty(resourceConfig, key);
    if (error) return error;

    error = filter._relationshipIsForeign(resourceConfig, key);
    if (error) return error;

    parsedFilterElement = filter._parseFilterElement(key, resourceConfig.attributes[key], filterElement);
    if (parsedFilterElement.error) return parsedFilterElement.error;

    processedFilter[key] = [].concat(parsedFilterElement.result);
  }

  request.processedFilter = processedFilter;

  return null;
};
