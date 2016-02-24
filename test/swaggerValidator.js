"use strict";
var swaggerValidator = module.exports = { };

var swagger = require("../lib/swagger");
var url = require("url");
var swaggerDoc;


swaggerValidator.assert = function(params, statusCode, json) {
  if (!swaggerDoc) swaggerDoc = swagger.generateDocumentation();
  var urlObj = url.parse(params.url, true);
  swaggerValidator._validateRequest(params.method.toLowerCase(), urlObj.pathname, JSON.parse(params.body || "null"));
  swaggerValidator._validatePayload(params.method.toLowerCase(), urlObj.pathname, statusCode, JSON.parse(json));
};

swaggerValidator._validateRequest = function(method, path, body) {
  var model = swaggerValidator._getModel(method, path);

  // Default Error model only implies a 404
  if (Object.keys(model.responses).length === 1) return null;

  var bodySchema = model.parameters.filter(function(parameter) {
    return parameter.in === "body";
  }).pop();

  // If there is no schema and no body, all is good
  if (!bodySchema && !body) return null;

  return swaggerValidator._validateModel(bodySchema.schema, body, method + "@" + path, "request", true);
};

swaggerValidator._validatePayload = function(method, path, httpCode, payload) {
  var model = swaggerValidator._getModel(method, path);
  var schema = model.responses[httpCode];

  if (!schema) {
    schema = model.responses.default;
  }
  if (!schema) throw new Error("Unknown payload for " + method + ", " + path + ", " + httpCode);

  return swaggerValidator._validateModel(schema.schema, payload, method + "@" + path, "response", true);
};

swaggerValidator._getModel = function(method, path) {
  path = path.replace("/rest/", "/").replace(/\/$/, "");
  var match = Object.keys(swaggerDoc.paths).filter(function(somePath) {
    somePath = somePath.replace(/\{[a-zA-Z-_]*\}/gi, "(.*?)");
    somePath = "^" + somePath + "$";
    somePath = new RegExp(somePath);
    return somePath.test(path);
  }).pop();

  if (!match) {
    if (path.indexOf("foobar") !== -1) {
      return { responses: { default: { schema: { $ref: "#/definitions/error" } } } };
    }
    throw new Error("Swagger Validation: No matching path for " + path);
  }

  match = swaggerDoc.paths[match];
  match = match[method];

  if (!match) {
    throw new Error("Swagger Validation: No matching path for " + method + " " + path);
  }
  return match;
};

swaggerValidator._validateModel = function(model, payload, urlPath, validationPath, required) {
  if (!model) return;
  if (required && !payload) {
    throw new Error("Swagger Validation: " + urlPath + " Expected required value at " + validationPath);
  }
  if (!payload) return;

  if (model.$ref) {
    model = swaggerValidator._getRef(model.$ref);
  }

  if (model.type === "array") {
    swaggerValidator._validateArray(model, payload, urlPath, validationPath);
  } else if (model.type === "object") {
    swaggerValidator._validateObject(model, payload, urlPath, validationPath);
  } else {
    swaggerValidator._validateOther(model, payload, urlPath, validationPath);
  }
};

swaggerValidator._validateArray = function(model, payload, urlPath, validationPath) {
  if (!(payload instanceof Array)) {
    throw new Error("Swagger Validation: " + urlPath + " Expected Array at " + validationPath);
  }
  payload.forEach(function(i, j) {
    swaggerValidator._validateModel(model.items, i, urlPath, validationPath + "[" + j + "]", model.required);
  });
};

swaggerValidator._validateObject = function(model, payload, urlPath, validationPath) {
  if (!model.properties) return;

  for (var i in model.properties) {
    var isRequired = ((model.required || [ ]).indexOf(i) !== -1);
    swaggerValidator._validateModel(model.properties[i], payload[i], urlPath, validationPath + "." + i, isRequired);
  }

  for (var j in payload) {
    if (!model.properties[j]) {
      throw new Error("Swagger Validation: " + urlPath + " Found unexpected property at " + validationPath + "." + j);
    }
  }
};

swaggerValidator._validateOther = function(model, payload, urlPath, validationPath) {
  if (model.type === "string") {
    if (typeof payload !== "string") {
      throw new Error("Swagger Validation: " + urlPath + " Expected string at " + validationPath + ", got " + typeof payload);
    }
  } else if (model.type === "number") {
    if (typeof payload !== "number") {
      throw new Error("Swagger Validation: " + urlPath + " Expected number at " + validationPath + ", got " + typeof payload);
    }
  } else if (model.type === "boolean") {
    if (typeof payload !== "boolean") {
      throw new Error("Swagger Validation: " + urlPath + " Expected boolean at " + validationPath + ", got " + typeof payload);
    }
  } else {
    throw new Error("Swagger Validation: " + urlPath + " Unknown type " + model.type + " at " + validationPath);
  }
};

swaggerValidator._getRef = function(ref) {
  ref = ref.split("/");
  ref.shift();
  var model = swaggerDoc;
  while(ref.length) {
    model = model[ref.shift()];
  }
  return model;
};
