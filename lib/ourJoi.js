/* @flow weak */
"use strict";
var ourJoi = module.exports = { };


var Joi = require("joi");

ourJoi._joiBase = function(resourceName) {
  var relationType = Joi.object().keys({
    id: Joi.string().required(),
    type: Joi.any().required().valid(resourceName),
    meta: Joi.object().optional()
  });
  return relationType;
};
Joi.one = function(resource) {
  var obj = Joi.alternatives().try(
    Joi.any().valid(null), // null
    ourJoi._joiBase(resource)
  );
  obj._settings = {
    __one: resource
  };
  return obj;
};
Joi.many = function(resource) {
  var obj = Joi.array().items(ourJoi._joiBase(resource));
  obj._settings = {
    __many: resource
  };
  return obj;
};
Joi._validateForeignRelation = function(config) {
  if (!config.as) throw new Error("Missing 'as' property when defining a foreign relation");
  if (!config.resource) throw new Error("Missing 'resource' property when defining a foreign relation");
};
Joi.belongsToOne = function(config) {
  Joi._validateForeignRelation(config);
  var obj = Joi.alternatives().try(
    Joi.any().valid(null), // null
    ourJoi._joiBase(config.resource)
  );
  obj._settings = {
    __one: config.resource,
    __as: config.as
  };
  return obj;
};
Joi.belongsToMany = function(config) {
  Joi._validateForeignRelation(config);
  var obj = Joi.array().items(ourJoi._joiBase(config.resource));
  obj._settings = {
    __many: config.resource,
    __as: config.as
  };
  return obj;
};
ourJoi.Joi = Joi;
