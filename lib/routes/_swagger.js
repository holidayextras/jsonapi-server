"use strict";
var swagger = module.exports = { };

var router = require("../router.js");
var swaggerGenerator = require("../swagger");
var jsonApi = require("../../");


swagger.register = function() {
  if (!jsonApi._apiConfig.swagger) return;

  router.bindRoute({
    verb: "get",
    path: "swagger.json"
  }, function(request, resourceConfig, res) {
    if (!swagger._cache) {
      swagger._cache = swaggerGenerator.generateDocumentation();
    }

    return res.json(swagger._cache);
  });
};
