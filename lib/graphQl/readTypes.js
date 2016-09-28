/* @flow weak */
"use strict";
var readTypes = module.exports = { };

var graphQl = require('graphql');
var joiConverter = require('./joiConverter.js');
var resolvers = require('./resolvers.js');
var filterArgs = require('./filterArgs.js');

readTypes.generate = function(allResourceConfig) {
  var allReadTypes = { };
  Object.keys(allResourceConfig).forEach(function(resource) {
    allReadTypes[resource] = readTypes.createReadType(allResourceConfig[resource], allReadTypes);
  });
  return allReadTypes;
};

readTypes.createReadType = function(resourceConfig, otherTypes) {

  var someType = {
    name: resourceConfig.resource,
    description: resourceConfig.description,
    args: filterArgs.generate(resourceConfig.resource),
    fields: function() {
      var fields = {
        id: {
          type: new graphQl.GraphQLNonNull(graphQl.GraphQLString),
          description: 'The UUID of the resource'
        }
      };

      Object.keys(resourceConfig.attributes).forEach(function(attribute) {
        if ((attribute === "id") || (attribute === "type") || (attribute === "meta")) return;

        var joiScheme = resourceConfig.attributes[attribute];
        fields[attribute] = {
          type: joiConverter.swap(joiScheme, otherTypes),
          description: joiScheme._description,
          resolve: resolvers.search.bind(resolvers, resourceConfig, attribute)
        };
        if (joiScheme._settings) {
          var otherResource = joiScheme._settings.__one || joiScheme._settings.__many;
          fields[attribute].args = filterArgs.generate(otherResource);
        }
      });
      return fields;
    }
  };

  return new graphQl.GraphQLObjectType(someType);
};
