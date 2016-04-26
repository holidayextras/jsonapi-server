/* @flow weak */
"use strict";
var swagger = module.exports = { };
var jsonApi = require("../../");
var swaggerPaths = require("./paths.js");
var swaggerResources = require("./resources.js");

swagger.generateDocumentation = function() {
  var swaggerDoc = swagger._getSwaggerBase();
  swaggerDoc.paths = swaggerPaths.getPathDefinitions(jsonApi);
  swaggerDoc.definitions = swaggerResources.getResourceDefinitions(jsonApi);
  return swaggerDoc;
};

swagger._getSwaggerBase = function() {
  var swaggerConfig = jsonApi._apiConfig.swagger || { };
  return {
    swagger: "2.0",
    info: {
      title: swaggerConfig.title,
      version: swaggerConfig.version,
      description: swaggerConfig.description,
      contact: {
        name: (swaggerConfig.contact || { }).name,
        email: (swaggerConfig.contact || { }).email,
        url: (swaggerConfig.contact || { }).url
      },
      license: {
        name: (swaggerConfig.license || { }).name,
        url: (swaggerConfig.license || { }).url
      }
    },
    host: jsonApi._apiConfig.host,
    basePath: jsonApi._apiConfig.base.substring(0, jsonApi._apiConfig.base.length - 1),
    schemes: [ jsonApi._apiConfig.protocol ],
    consumes: [
      "application/vnd.api+json"
    ],
    produces: [
      "application/vnd.api+json"
    ],
    parameters: {
      sort: {
        name: "sort",
        in: "query",
        description: "Sort resources as per the JSON:API specification",
        required: false,
        type: "string"
      },
      include: {
        name: "include",
        in: "query",
        description: "Fetch additional resources as per the JSON:API specification",
        required: false,
        type: "string"
      },
      filter: {
        name: "filter",
        in: "query",
        description: "Filter resources as per the JSON:API specification",
        required: false,
        type: "string"
      },
      fields: {
        name: "fields",
        in: "query",
        description: "Limit response payloads as per the JSON:API specification",
        required: false,
        type: "string"
      },
      page: {
        name: "page",
        in: "query",
        description: "Pagination namespace",
        required: false,
        type: "string"
      }
    },
    paths: { },
    definitions: { }
  };
};
