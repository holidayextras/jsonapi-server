/* @flow weak */
"use strict";
var helper = module.exports = { };

var Joi = require("joi");
var responseHelper = require("../responseHelper.js");
var router = require("../router.js");
var debug = require("../debugging.js");
var _ = {
  assign: require("lodash.assign")
};


helper.validate = function(someObject, someDefinition, callback) {
  debug.validationInput(JSON.stringify(someObject));
  Joi.validate(someObject, someDefinition, { abortEarly: false }, function (err, sanitisedObject) {
    if (err) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Param validation failed",
        detail: err.details
      });
    }
    _.assign(someObject, sanitisedObject);
    callback();
  });
};

helper.checkForBody = function(request, callback) {
  if (!request.params.data) {
    return callback({
      status: "403",
      code: "EFORBIDDEN",
      title: "Request validation failed",
      detail: "Missing \"data\" - have you sent the right http headers?"
    });
  }
  callback();
};

helper.handleError = function(request, res, err) {
  var errorResponse = responseHelper.generateError(request, err);
  var httpCode = errorResponse.errors[0].status || 500;
  return router.sendResponse(res, errorResponse, httpCode);
};

helper.verifyRequest = function(request, resourceConfig, res, handlerRequest, callback) {
  if (!resourceConfig) {
    return helper.handleError(request, res, {
      status: "404",
      code: "ENOTFOUND",
      title: "Resource not found",
      detail: "The requested resource '" + request.params.type + "' does not exist"
    });
  }

  if (!resourceConfig.handlers.ready) {
    return helper.handleError(request, res, {
      status: "503",
      code: "EUNAVAILABLE",
      title: "Resource temporarily unavailable",
      detail: "The requested resource '" + request.params.type + "' is temporarily unavailable"
    });
  }

  if (!resourceConfig.handlers[handlerRequest]) {
    return helper.handleError(request, res, {
      status: "403",
      code: "EFORBIDDEN",
      title: "Resource not supported",
      detail: "The requested resource '" + request.params.type + "' does not support '" + handlerRequest + "'"
    });
  }

  return callback();
};
