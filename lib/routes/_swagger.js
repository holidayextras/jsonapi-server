/* @flow weak */
"use strict";
var swagger = module.exports = {};

var router = require("../router.js");
var swaggerGenerator = require("../swagger");
var jsonApi = require("../../");
var fs = require("fs");

swagger.register = function () {
  if (!jsonApi._apiConfig.swagger) return;

  router.bindRoute({
    verb: "get",
    path: "swagger.json"
  }, function (request, resourceConfig, res) {
    //Check to see if the swagger file has already been read in.
    if (!swagger._cache) {
      swagger._cache = JSON.stringify(swaggerGenerator.generateDocumentation());
      //Lets write it out so we can have access to this file in the file system.
      fs.writeFileSync('./apple/swagger/swagger.json', swagger._cache, 'utf8');
    }
    //The swagger.json file was already cached so just return it.
    return res.send(swagger._cache);
  });
};