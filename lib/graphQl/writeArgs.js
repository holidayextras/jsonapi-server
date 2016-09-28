/* @flow weak */
"use strict";
var writeArgs = module.exports = { };

var graphQl = require('graphql');
var jsonApi = require('../..');
var joiConverter = require('./joiConverter.js');

writeArgs.generate = function(resource, allWriteTypes) {
  var args = {
    id: { type: graphQl.GraphQLString }
  };
  var resourceConfig = jsonApi._resources[resource];
  Object.keys(resourceConfig.attributes).forEach(function(attribute) {
    if ((attribute === "id") || (attribute === "type") || (attribute === "meta")) return;

    var joiScheme = resourceConfig.attributes[attribute];
    if (joiScheme._settings && joiScheme._settings.__as) return;

    args[attribute] = {
      type: joiConverter.shallowInput(joiScheme, allWriteTypes),
      description: joiScheme._description
    };
  });
  return args;
};
