/* @flow weak */
"use strict";
var writeTypes = module.exports = { };

var graphQl = require('graphql');
var writeArgs = require('./writeArgs.js');

writeTypes.generate = function(allResourceConfig) {
  var allWriteTypes = { };
  Object.keys(allResourceConfig).forEach(function(resource) {
    allWriteTypes[resource] = writeTypes.createWriteType(allResourceConfig[resource], allWriteTypes);
  });
  return allWriteTypes;
};

writeTypes.createWriteType = function(resourceConfig, allWriteTypes) {

  var someType = {
    name: resourceConfig.resource + "Write",
    description: resourceConfig.description,
    fields: function() {
      return writeArgs.generate(resourceConfig.resource, allWriteTypes);
    }
  };

  return new graphQl.GraphQLInputObjectType(someType);
};
