/* @flow weak */
"use strict";
var filterArgs = module.exports = { };

var graphQl = require('graphql');
var jsonApi = require('../..');

filterArgs.generate = function(resource) {
  var args = { };
  var resourceConfig = jsonApi._resources[resource];
  Object.keys(resourceConfig.attributes).forEach(function(attribute) {
    args[attribute] = {
      description: 'Filter string',
      type: graphQl.GraphQLString
    };
  });
  return args;
};
