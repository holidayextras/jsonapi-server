"use strict";
var jsonApi = module.exports = { };

var _ = require("underscore");
var Joi = require("joi");
var router = require("./router.js");
var responseHelper = require("./responseHelper.js");
var routes = require("./routes");
var mockHandlers = require("./mockHandlers.js");
var postProcess = require("./postProcess.js");

jsonApi.mockHandlers = mockHandlers.handlers;
jsonApi._resources = { };
jsonApi._apiConfig = { };

jsonApi.setConfig = function(apiConfig) {
  jsonApi._apiConfig = apiConfig;
  jsonApi._apiConfig.base = jsonApi._cleanBaseUrl(jsonApi._apiConfig.base);
  responseHelper.setBaseUrl(jsonApi._apiConfig.base);
  responseHelper.setMetadata(jsonApi._apiConfig.meta);
  router.using(jsonApi);
  postProcess.using(jsonApi);
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

  if (resourceConfig.handlers.initialise) {
    resourceConfig.handlers.initialise(resourceConfig);
  }

  resourceConfig.searchParams = _.extend({
    type: Joi.any().required().valid(resourceConfig.resource)
      .description("Always \"" + resourceConfig.resource + "\"")
      .example(resourceConfig.resource),
    sort: Joi.any()
      .description("An attribute to sort by")
      .example("title"),
    filter: Joi.any()
      .description("An attribute+value to filter by")
      .example("title"),
    fields: Joi.any()
      .description("An attribute+value to filter by")
      .example("title"),
    include: Joi.any()
      .description("An attribute to include")
      .example("title"),
    relationships: Joi.any()
      .description("An attribute to include")
      .example("title")
  }, resourceConfig.searchParams);

  resourceConfig.attributes = _.extend({
    id: Joi.string().required()
      .description("Unique resource identifier")
      .example("1234"),
    type: Joi.string().required().valid(resourceConfig.resource)
      .description("Always \"" + resourceConfig.resource + "\"")
      .example(resourceConfig.resource)
  }, resourceConfig.attributes);

  resourceConfig.onCreate = _.pick.apply(_, [].concat(resourceConfig.attributes, Object.keys(resourceConfig.attributes).filter(function(i) {
    return (resourceConfig.attributes[i]._meta.indexOf("readonly") === -1) && (!(resourceConfig.attributes[i]._settings || { }).__as);
  })));
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

jsonApi._joiBase = function(resourceName) {
  return Joi.object().keys({
    id: Joi.string().required(),
    type: Joi.any().required().valid(resourceName)
  });
};
Joi.one = function(resource) {
  var obj = jsonApi._joiBase(resource);
  obj._settings = {
    __one: resource
  };
  return obj;
};
Joi.many = function(resource) {
  var obj = Joi.array().items(jsonApi._joiBase(resource));
  obj._settings = {
    __many: resource
  };
  return obj;
};
Joi.belongsToOne = function(config) {
  var obj = jsonApi._joiBase(config.resource);
  obj._settings = {
    __one: config.resource,
    __as: config.as
  };
  return obj;
};
Joi.belongsToMany = function(config) {
  var obj = Joi.array().items(jsonApi._joiBase(config.resource));
  obj._settings = {
    __many: config.resource,
    __as: config.as
  };
  return obj;
};
jsonApi.Joi = Joi;
