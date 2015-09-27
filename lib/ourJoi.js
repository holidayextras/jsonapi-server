"use strict";
var ourJoi = module.exports = { };


var Joi = require("joi");

ourJoi._joiBase = function(resourceName) {
  var relationType = Joi.object().keys({
    id: Joi.string().required(),
    type: Joi.any().required().valid(resourceName),
    meta: Joi.object().optional()
  });
  return Joi.alternatives().try(
    Joi.any().valid(null), // null
    relationType           // relation
  );

};
Joi.one = function(resource) {
  var obj = ourJoi._joiBase(resource);
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
Joi.belongsToOne = function(config) {
  var obj = ourJoi._joiBase(config.resource);
  obj._settings = {
    __one: config.resource,
    __as: config.as
  };
  return obj;
};
Joi.belongsToMany = function(config) {
  var obj = Joi.array().items(ourJoi._joiBase(config.resource));
  obj._settings = {
    __many: config.resource,
    __as: config.as
  };
  return obj;
};
ourJoi.Joi = Joi;
