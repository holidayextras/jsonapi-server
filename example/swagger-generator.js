"use strict";
var swagger = module.exports = {};

swagger.config = {
  verb: "get",
  path: "swagger.json",
  skipDefaultHeaders: true
};

swagger.handler = function(request, resourceConfig, res) {
  res.set({
    "Content-Type": "text/html"
  });
  res.end("<strong>Hello World!</strong>");
};

