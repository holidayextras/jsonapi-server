"use strict";
var jsonApi = module.exports = { };
jsonApi._resources = { };
jsonApi._apiConfig = { };

var _ = require("underscore");
var ourJoi = require("./ourJoi.js");
var router = require("./router.js");
var responseHelper = require("./responseHelper.js");
var handlerEnforcer = require("./handlerEnforcer.js");
var routes = require("./routes");
var url = require("url");

jsonApi.Joi = ourJoi.Joi;
jsonApi.MemoryHandler = require("./MemoryHandler");

jsonApi.setConfig = function(apiConfig) {
  jsonApi._apiConfig = apiConfig;
  jsonApi._apiConfig.base = jsonApi._cleanBaseUrl(jsonApi._apiConfig.base);
  jsonApi._apiConfig.pathPrefix = jsonApi._concatenateUrlPrefix(jsonApi._apiConfig);
  responseHelper.setBaseUrl(jsonApi._apiConfig.pathPrefix);
  responseHelper.setMetadata(jsonApi._apiConfig.meta);
};

jsonApi.authenticate = router.authenticateWith;

jsonApi._concatenateUrlPrefix = function(config) {
  return url.format({
    protocol: config.protocol,
    hostname: config.hostname,
    port: config.port,
    pathname: config.base
  });
};

jsonApi._cleanBaseUrl = function(base) {
  if (!base) {
    base = "";
  }
  if (base[0] !== "/") {
    base = "/" + base;
  }
  if (base[base.length - 1] !== "/") {
    base += "/";
  }
  return base;
};

jsonApi.define = function(resourceConfig) {
  resourceConfig.namespace = resourceConfig.namespace || "default";
  resourceConfig.searchParams = resourceConfig.searchParams || { };
  jsonApi._resources[resourceConfig.resource] = resourceConfig;

  handlerEnforcer.wrap(resourceConfig.handlers);

  if (resourceConfig.handlers.initialise) {
    resourceConfig.handlers.initialise(resourceConfig);
  }

  Object.keys(resourceConfig.attributes).forEach(function(attribute) {
    if (!attribute.match(/^[A-Za-z0-9\-\_]*$/)) {
      throw new Error("Attribute '" + attribute + "' on " + resourceConfig.resource + " contains illegal characters!");
    }
  });

  resourceConfig.searchParams = _.extend({
    type: ourJoi.Joi.any().required().valid(resourceConfig.resource)
      .description("Always \"" + resourceConfig.resource + "\"")
      .example(resourceConfig.resource),
    sort: ourJoi.Joi.any()
      .description("An attribute to sort by")
      .example("title"),
    filter: ourJoi.Joi.any()
      .description("An attribute+value to filter by")
      .example("title"),
    fields: ourJoi.Joi.any()
      .description("An attribute+value to filter by")
      .example("title"),
    include: ourJoi.Joi.any()
      .description("An attribute to include")
      .example("title"),
    relationships: ourJoi.Joi.any()
      .description("An attribute to include")
      .example("title"),
    page: ourJoi.Joi.any()
      .description("Pagination data")
      .example("{ offset: 10, limit: 5 }")
  }, resourceConfig.searchParams);

  resourceConfig.attributes = _.extend({
    id: ourJoi.Joi.string().required()
      .description("Unique resource identifier")
      .example("1234"),
    type: ourJoi.Joi.string().required().valid(resourceConfig.resource)
      .description("Always \"" + resourceConfig.resource + "\"")
      .example(resourceConfig.resource),
    meta: ourJoi.Joi.object().optional()
  }, resourceConfig.attributes);

  resourceConfig.onCreate = _.pick.apply(_, [].concat(resourceConfig.attributes, Object.keys(resourceConfig.attributes).filter(function(i) {
    return (resourceConfig.attributes[i]._meta.indexOf("readonly") === -1) && (!(resourceConfig.attributes[i]._settings || { }).__as);
  })));
};

jsonApi.onUncaughtException = function(errHandler) {
  jsonApi._errHandler = errHandler;
};

jsonApi.start = function() {
  routes.register();
  router.listen(jsonApi._apiConfig.port);
};

jsonApi.close = function() {
  router.close();
  for (var i in jsonApi._resources) {
    var resourceConfig = jsonApi._resources[i];
    if (resourceConfig.handlers.close) resourceConfig.handlers.close();
  }
};
